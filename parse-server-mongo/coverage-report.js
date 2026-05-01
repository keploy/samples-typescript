#!/usr/bin/env node
//
// coverage-report.js — convert NODE_V8_COVERAGE dumps into a
// `Covered N/M (XX.X%)` line-coverage summary for the running
// `flow.sh coverage` subcommand.
//
// Why a custom tool: c8's report path filters `node_modules/**` by
// default and the include-overrides don't reliably reach into a
// vendored library tree. The V8 data does contain those scripts —
// c8 just refuses to include them. This script reads the same V8
// dumps c8 reads and applies exactly the filter we want.
//
// V8 coverage shape (block-level when NODE_V8_COVERAGE is set):
// each `function.ranges` is a list of nested ranges. The outermost
// range is the function body with its call count. Inner ranges
// flag basic blocks that V8 tracks separately — most of them are
// branches with count=0 that did NOT execute. A byte position's
// effective execution count is determined by the DEEPEST range
// that contains it. We compute line coverage from that.
//
// Inputs (env):
//   NODE_V8_COVERAGE      — directory containing coverage-*.json
//                           V8 dumps (default /coverage).
//   COVERAGE_INCLUDE      — substring; only file URLs containing
//                           this string contribute to the metric
//                           (default: "node_modules/parse-server/lib").
//   COVERAGE_REPORT_FILE  — output path for the human-readable
//                           summary (default coverage_report.txt
//                           in CWD).
'use strict';

const fs = require('fs');
const path = require('path');

const dumpDir = process.env.NODE_V8_COVERAGE || '/coverage';
const filter = process.env.COVERAGE_INCLUDE || 'node_modules/parse-server/lib';
const reportFile = process.env.COVERAGE_REPORT_FILE || 'coverage_report.txt';

const dumps = fs.readdirSync(dumpDir)
    .filter(f => f.startsWith('coverage-') && f.endsWith('.json'));

if (dumps.length === 0) {
    console.log(`INFO: no V8 coverage dumps under ${dumpDir} — base image is uninstrumented (apply docker-compose.coverage.yml overlay to enable)`);
    fs.writeFileSync(reportFile, '');
    process.exit(0);
}

// Per-file state: source bytes, line-start offsets, totalLines set,
// coveredLines set. Aggregated across multiple V8 dumps and across
// all functions/ranges in each dump.
const files = new Map();

function ensureFileEntry(filepath) {
    let entry = files.get(filepath);
    if (entry) return entry;
    if (!fs.existsSync(filepath)) return null;
    const src = fs.readFileSync(filepath, 'utf8');
    const lineStartOffsets = [0];
    let off = 0;
    for (const ch of src) {
        off += Buffer.byteLength(ch, 'utf8');
        if (ch === '\n') lineStartOffsets.push(off);
    }
    // totalLines: every line whose source has at least one
    // non-whitespace, non-pure-bracket-or-comment char. This
    // approximates the "executable line" set Istanbul/coverage.py
    // count, with predictable bias on heavily braced styles.
    const lines = src.split('\n');
    const total = new Set();
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed === '' ||
            /^\/\//.test(trimmed) || /^\*/.test(trimmed) || /^\/\*/.test(trimmed) ||
            /^[\{\}\)\];,]+$/.test(trimmed)) {
            continue;
        }
        total.add(i + 1);
    }
    entry = { src, lineStartOffsets, totalLines: total, executedRanges: [] };
    files.set(filepath, entry);
    return entry;
}

function offsetToLine(entry, byteOffset) {
    // Largest i such that lineStartOffsets[i] <= byteOffset.
    let lo = 0, hi = entry.lineStartOffsets.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >>> 1;
        if (entry.lineStartOffsets[mid] <= byteOffset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
}

let scriptCount = 0;
let matchingScripts = 0;
for (const dumpName of dumps) {
    const data = JSON.parse(fs.readFileSync(path.join(dumpDir, dumpName), 'utf8'));
    for (const result of data.result || []) {
        scriptCount++;
        const url = result.url || '';
        if (!url.startsWith('file://')) continue;
        if (!url.includes(filter)) continue;
        matchingScripts++;
        const filepath = url.replace(/^file:\/\//, '');
        const entry = ensureFileEntry(filepath);
        if (!entry) continue;
        // Collect every range; we'll resolve nesting per-line below.
        for (const fn of result.functions || []) {
            for (const range of fn.ranges || []) {
                entry.executedRanges.push({
                    start: range.startOffset,
                    end: range.endOffset,
                    count: range.count,
                });
            }
        }
    }
}

// For each file, resolve per-line execution count by finding the
// deepest range containing the line's first non-whitespace byte.
// Deepest = smallest end-start (most specific).
function resolveCoverage(entry) {
    const ranges = entry.executedRanges;
    // Sort by start asc, end desc — outermost first, innermost last
    // when starts tie. (Not strictly required for the per-line
    // search below; just makes the data tidy.)
    ranges.sort((a, b) => (a.start - b.start) || (b.end - a.end));

    const covered = new Set();
    for (const lineNum of entry.totalLines) {
        const lineStart = entry.lineStartOffsets[lineNum - 1];
        // Pick the deepest (smallest-span) range whose [start,end)
        // contains lineStart. If none, the line isn't in any
        // tracked function — typically top-level module code; treat
        // as uncovered. If the deepest range has count > 0, line
        // is covered.
        let best = null;
        let bestSpan = Infinity;
        for (const r of ranges) {
            if (r.start <= lineStart && lineStart < r.end) {
                const span = r.end - r.start;
                if (span < bestSpan) {
                    best = r;
                    bestSpan = span;
                }
            }
        }
        if (best && best.count > 0) covered.add(lineNum);
    }
    return covered;
}

let totalLines = 0;
let coveredLines = 0;
const perFile = [];
for (const [filepath, entry] of files) {
    const covered = resolveCoverage(entry);
    totalLines += entry.totalLines.size;
    coveredLines += covered.size;
    perFile.push({
        filepath,
        total: entry.totalLines.size,
        covered: covered.size,
    });
}

const pct = totalLines > 0 ? (coveredLines * 100 / totalLines) : 0;
const pctFmt = pct.toFixed(1);

perFile.sort((a, b) => a.filepath.localeCompare(b.filepath));

const out = [];
out.push('============== parse-server line coverage (V8, custom report) ==============');
out.push(`V8 dumps consumed:        ${dumps.length}`);
out.push(`Scripts in V8 dump:       ${scriptCount}`);
out.push(`Scripts matching filter:  ${matchingScripts}`);
out.push(`Source files measured:    ${files.size}`);
out.push('');
out.push('Per-file coverage (top 20 by uncovered lines):');
const sortedByMissing = perFile.slice().sort((a, b) => (b.total - b.covered) - (a.total - a.covered));
for (const r of sortedByMissing.slice(0, 20)) {
    const rel = r.filepath.replace(/^.*node_modules\//, '');
    const p = r.total > 0 ? (r.covered * 100 / r.total).toFixed(1) : '0.0';
    out.push(`  ${rel.padEnd(58)} ${String(r.covered).padStart(5)}/${String(r.total).padStart(5)}  ${p.padStart(5)}%`);
}
out.push('');
out.push(`Covered ${coveredLines}/${totalLines} (${pctFmt}%)`);
out.push('============================================================================');

const text = out.join('\n') + '\n';
fs.writeFileSync(reportFile, text);
process.stdout.write(text);

// Also drop a c8-style json-summary alongside.
const summary = {
    total: {
        lines:      { total: totalLines, covered: coveredLines, skipped: 0, pct: parseFloat(pctFmt) },
        statements: { total: totalLines, covered: coveredLines, skipped: 0, pct: parseFloat(pctFmt) },
        functions:  { total: 0, covered: 0, skipped: 0, pct: 0 },
        branches:   { total: 0, covered: 0, skipped: 0, pct: 0 },
    },
};
fs.writeFileSync(path.join(dumpDir, 'coverage-summary.json'), JSON.stringify(summary));
