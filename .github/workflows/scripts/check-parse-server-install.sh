#!/usr/bin/env bash
#
# check-parse-server-install.sh — builds the sample's images and checks how
# their dependency install works. Both npm defects below have failed the
# keploy/enterprise lane that builds this sample, with nothing wrong in the
# commit under test.
#
#   1. The npm that RUNS `npm ci` has the fix for npm/cli#7308. Older ones
#      name the temp files of their download cache with 8 hex digits of
#      Math.random(); two alive together can get the same name, and the
#      install then exits 254 on "EEXIST ... rename". The fix is cacache
#      20.0.4, which npm bundles from 11.12.0. node:20 ships npm 10.8.2.
#
#      This is checked on the npm process that ran `npm ci`, not on the npm
#      left in the image: a Dockerfile that installs first and upgrades npm
#      afterwards ends with a fixed npm and still installed on 10.8.2. The
#      probe is a copy of the context whose package.json has a
#      devEngines.packageManager entry that no npm satisfies. npm 10.9.0 and
#      later check devEngines when `npm ci` starts, before they read the lock
#      or the network, refuse with EBADDEVENGINES and print their own version;
#      older npm ignore the field and install. So the build of that copy must
#      stop in the step that runs `npm ci`, refused by npm 11.12.0 or newer.
#
#   2. The npm left in the image bundles cacache 20.0.4 or newer. Later steps
#      use it (Dockerfile.coverage's `npm install -g c8`), and so does anyone
#      who runs npm in the container.
#
#   3. Dependencies come from package-lock.json, through `npm ci`. With
#      `npm install` and no lock, every build took the newest version of
#      whatever the tree asks for as `*`, and a version published a minute
#      earlier answered 404 for its tarball. The proof is a build that must
#      fail: the same Dockerfile, with a package.json that asks for a package
#      the lock does not have. `npm ci` refuses it (EUSAGE); `npm install`
#      would fetch the package and carry on. npm reads that package's metadata
#      from the registry before it can compare, so when the registry does not
#      answer this check cannot run, and says so.
#
#   4. No layer of the image carries npm's cache (/root/.npm). It was 269 MB
#      of the image, nothing reads it after the build, and the enterprise lane
#      stores and loads this image as a tarball. A `rm -rf /root/.npm` in a
#      later layer than the one that filled it does not count: the bytes stay
#      in the earlier layer.
#
# Run from parse-server-mongo/. Checks Dockerfile and Dockerfile.coverage, or
# the Dockerfiles named as arguments. DOCKER sets the docker command
# (DOCKER="sudo docker" where the daemon needs root). Scratch files go to
# TMPDIR.
set -Eeuo pipefail

MIN_NPM=11.12.0
MIN_CACACHE=20.0.4
# A package that is not in the lock. Any published one does.
EXTRA_NAME=left-pad
EXTRA_VERSION=1.3.0
# A version no npm has, for the devEngines probe.
PROBE_NPM_VERSION=0.0.0-install-check

read -r -a docker_cmd <<<"${DOCKER:-docker}"

dockerfiles=("$@")
[ "${#dockerfiles[@]}" -gt 0 ] || dockerfiles=(Dockerfile Dockerfile.coverage)

work=$(mktemp -d)
tags=()
cleanup() {
    rm -rf "$work"
    [ "${#tags[@]}" -eq 0 ] || "${docker_cmd[@]}" rmi -f "${tags[@]}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

failures=0
fail() {
    echo "::error::$*"
    failures=$((failures + 1))
}

# version_at_least MIN V: V is MIN or newer.
version_at_least() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n 1)" = "$1" ]
}

# npm_error_code LOG: the first npm error code in a build log.
npm_error_code() {
    grep -m 1 -oE 'npm (error|ERR!) code [A-Za-z0-9_]+' "$1" | awk '{print $NF}' || true
}

# registry_error CODE: the code is the registry or the network not answering,
# not something the Dockerfile did.
registry_error() {
    case "$1" in
        ENOTCACHED | ECONNREFUSED | ECONNRESET | ETIMEDOUT | ESOCKETTIMEDOUT | EAI_AGAIN | ENOTFOUND | \
            EHOSTUNREACH | ENETUNREACH | ENETDOWN | EPIPE | EPROTO | ERR_SOCKET_TIMEOUT | E404 | E408 | E429 | E5[0-9][0-9])
            return 0 ;;
    esac
    return 1
}

# failed_step LOG: the command of the RUN step a build log says failed, from
# BuildKit's `#N ERROR: process "/bin/sh -c CMD" did not complete successfully`.
failed_step() {
    grep -m 1 -E '^#[0-9]+ ERROR: process "/bin/sh -c ' "$1" |
        sed -E 's/^#[0-9]+ ERROR: process "\/bin\/sh -c (.*)" did not complete successfully.*/\1/' || true
}

# runs_npm_ci CMD: the shell command runs `npm ci` (or an alias of it).
runs_npm_ci() {
    printf '%s\n' "$1" | grep -qE '(^|[;&|[:space:]])npm[[:space:]]+(ci|clean-install|install-clean)([;&|[:space:]]|$)'
}

# copy_context DIR EDIT: a copy of the build context in DIR, with its
# package.json changed by the python statement EDIT (on `manifest`).
copy_context() {
    local dir=$1 edit=$2
    mkdir "$dir"
    tar --exclude=./node_modules --exclude=./coverage -cf - . | tar -xf - -C "$dir"
    python3 - "$dir/package.json" "$edit" <<'PY'
import json, sys
path, edit = sys.argv[1:3]
with open(path) as f:
    manifest = json.load(f)
exec(edit)
with open(path, "w") as f:
    json.dump(manifest, f, indent=2)
PY
}

# Check 3's context: a package.json the lock does not match.
drifted="$work/drifted"
copy_context "$drifted" "
if '$EXTRA_NAME' in manifest.get('dependencies', {}):
    sys.exit('$EXTRA_NAME is a dependency of the sample now; pick another EXTRA_NAME')
manifest.setdefault('dependencies', {})['$EXTRA_NAME'] = '$EXTRA_VERSION'
"
# Check 1's context: a devEngines entry that every npm which reads it refuses.
probe="$work/probe"
copy_context "$probe" "
manifest['devEngines'] = {'packageManager': {'name': 'npm', 'version': '$PROBE_NPM_VERSION', 'onFail': 'error'}}
"

# layers_with_npm_cache: reads `docker save` on stdin and prints, for each
# layer that has files under /root/.npm, the file count, the bytes and the
# instruction that made the layer. Prints nothing when there are none.
layers_with_npm_cache() {
    python3 -c '
import io, json, sys, tarfile

blobs, jsons = {}, {}
outer = tarfile.open(fileobj=sys.stdin.buffer, mode="r|")
for m in outer:
    if not m.isfile():
        continue
    f = outer.extractfile(m)
    if m.size < 4 << 20:
        data = f.read()
        try:
            jsons[m.name] = json.loads(data)
            continue
        except ValueError:
            f = io.BytesIO(data)
    try:
        inner = tarfile.open(fileobj=f, mode="r|*")
    except tarfile.ReadError:
        continue
    files = size = 0
    for e in inner:
        name = e.name[2:] if e.name.startswith("./") else e.name
        if e.isfile() and name.startswith("root/.npm/") and "/.wh." not in "/" + name:
            files += 1
            size += e.size
    blobs[m.name] = (files, size)

manifest = jsons["manifest.json"][0]
history = [h for h in jsons[manifest["Config"]].get("history", []) if not h.get("empty_layer")]
for i, layer in enumerate(manifest["Layers"]):
    files, size = blobs.get(layer, (0, 0))
    if files:
        made_by = history[i].get("created_by", "?") if i < len(history) else "?"
        print("%d files, %d bytes, in the layer made by: %s" % (files, size, made_by))
'
}

for dockerfile in "${dockerfiles[@]}"; do
    slug=$(echo "$dockerfile" | tr -c '[:alnum:]\n' '-' | tr '[:upper:]' '[:lower:]')
    tag="parse-server-mongo-install-check:${slug}"
    log="$work/${slug}.log"

    echo "== ${dockerfile}: build"
    if ! "${docker_cmd[@]}" build --progress=plain -f "$dockerfile" -t "$tag" . >"$log" 2>&1; then
        tail -n 40 "$log"
        fail "${dockerfile} does not build"
        continue
    fi
    tags+=("$tag")

    echo "== ${dockerfile}: the npm that runs npm ci has the cache fix"
    plog="$log.probe"
    tags+=("$tag-probe")
    if "${docker_cmd[@]}" build --progress=plain -f "$probe/$dockerfile" -t "$tag-probe" "$probe" >"$plog" 2>&1; then
        fail "${dockerfile} built with a devEngines entry that npm ${MIN_NPM} and newer refuse: its npm ci ran on an npm older than 10.9.0, which ignores devEngines (node:20's npm is 10.8.2)"
    else
        # The step that failed, and the npm version its refusal printed.
        cmd=$(failed_step "$plog")
        step=$(grep -m 1 -E '^#[0-9]+ ERROR: process "/bin/sh -c ' "$plog" | cut -d ' ' -f 1 || true)
        code=$(npm_error_code "$plog")
        ran=$(grep -E "^${step:-#none} .*EBADDEVENGINES +current: \{ name: 'npm', version: '[^']+'" "$plog" |
            sed -E "s/.*version: '([^']+)'.*/\1/" | head -n 1 || true)
        if [ -z "$cmd" ]; then
            tail -n 40 "$plog"
            fail "${dockerfile}: the devEngines probe failed outside a RUN step; see the log above"
        elif ! runs_npm_ci "$cmd"; then
            tail -n 40 "$plog"
            if [ -n "$code" ] && registry_error "$code"; then
                fail "${dockerfile}: the devEngines probe could not run: the registry did not answer in \`${cmd}\` (npm error code ${code}), before npm ci. This is the registry, not the Dockerfile; run the job again"
            else
                fail "${dockerfile}: the devEngines probe stopped in \`${cmd}\`, not in a step that runs npm ci: no step runs npm ci, or one ran before this one on an npm that ignores devEngines (older than 10.9.0)"
            fi
        elif [ -z "$ran" ]; then
            tail -n 40 "$plog"
            fail "${dockerfile}: \`${cmd}\` failed in the devEngines probe without npm's EBADDEVENGINES refusal (npm error code ${code:-none}). npm 10.9.0 and later refuse before they read the lock or the network, so the npm that ran it is older and ignores devEngines"
        elif ! version_at_least "$MIN_NPM" "$ran"; then
            fail "${dockerfile}: npm ci runs on npm ${ran}; npm/cli#7308 is fixed from npm ${MIN_NPM} (cacache ${MIN_CACACHE})"
        else
            echo "   npm ci ran on npm ${ran}"
        fi
    fi

    echo "== ${dockerfile}: the npm left in the image has the cache fix"
    # The single quotes are meant: the container's shell expands $(npm root -g).
    # shellcheck disable=SC2016
    cacache=$("${docker_cmd[@]}" run --rm --entrypoint sh "$tag" -c \
        'node -p "require(process.argv[1] + \"/npm/node_modules/cacache/package.json\").version" "$(npm root -g)"' \
        2>"$work/${slug}.cacache.err") || cacache=""
    if [ -z "$cacache" ]; then
        cat "$work/${slug}.cacache.err"
        fail "${dockerfile}: could not read the version of the cacache its npm bundles"
    elif ! version_at_least "$MIN_CACACHE" "$cacache"; then
        fail "${dockerfile}: the image's npm bundles cacache ${cacache}; npm/cli#7308 is fixed in ${MIN_CACACHE} (npm ${MIN_NPM})"
    else
        echo "   cacache ${cacache}"
    fi

    echo "== ${dockerfile}: a package.json the lock does not match must not build"
    dlog="$log.drifted"
    tags+=("$tag-drifted")
    if "${docker_cmd[@]}" build --progress=plain -f "$drifted/$dockerfile" -t "$tag-drifted" "$drifted" >"$dlog" 2>&1; then
        fail "${dockerfile} built with ${EXTRA_NAME}@${EXTRA_VERSION} in package.json and not in package-lock.json: it does not install from the lock"
    elif grep -q 'npm error code EUSAGE' "$dlog"; then
        echo "   refused: $(grep -m 1 -o 'Missing: .* from lock file' "$dlog" || echo 'npm error code EUSAGE')"
    else
        code=$(npm_error_code "$dlog")
        cmd=$(failed_step "$dlog")
        tail -n 40 "$dlog"
        if [ -n "$code" ] && registry_error "$code"; then
            fail "${dockerfile}: could not check the lock: the registry did not answer in \`${cmd}\` (npm error code ${code}). npm needs it to resolve ${EXTRA_NAME}@${EXTRA_VERSION} before it can compare package.json with the lock. This is the registry, not the Dockerfile; run the job again"
        else
            fail "${dockerfile}: the build with a package.json the lock does not match failed in \`${cmd:-?}\`, but not on npm ci's EUSAGE (npm error code ${code:-none})"
        fi
    fi

    echo "== ${dockerfile}: no layer carries npm's cache"
    if ! cached=$("${docker_cmd[@]}" save "$tag" | layers_with_npm_cache); then
        fail "${dockerfile}: could not read the image's layers"
    elif [ -n "$cached" ]; then
        while IFS= read -r line; do
            fail "${dockerfile}: /root/.npm is in the image: ${line}"
        done <<<"$cached"
    else
        echo "   none"
    fi
done

if [ "$failures" -gt 0 ]; then
    echo "${failures} check(s) failed"
    exit 1
fi
echo "OK: ${dockerfiles[*]} install from package-lock.json, on an npm that has the cache fix, and keep no npm cache"
