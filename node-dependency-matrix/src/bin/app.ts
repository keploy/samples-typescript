import * as grpc from '@grpc/grpc-js';
import express, { Response } from 'express';

import { getCatalogSyncJob, startCatalogSyncJob, waitForCatalogSyncJob } from '../lib/asyncJobs';
import { loadConfig, readExpectationsJson } from '../lib/config';
import {
  runAllDependencyScenarios,
  runGenericScenario,
  runGrpcScenario,
  runHttp2Scenario,
  runHttpScenario,
  runKafkaScenario,
  runMongoScenario,
  runMySqlScenario,
  runNamedScenario,
  runPostgresScenario,
  runRedisScenario,
  runSqsScenario
} from '../lib/dependencies';
import { error, info } from '../lib/log';
import { loadMatrixProto } from '../lib/proto';

const config = loadConfig();
const app = express();

app.use(express.json());

interface DedupOrderLineItem {
  quantity: number;
  sku: string;
}

interface DedupOrderPayload {
  customerTier: string;
  items: DedupOrderLineItem[];
  orderId: string;
}

function logScenarioStart(name: string): void {
  info('scenario started', { scenario: name });
}

function logScenarioSuccess(name: string, payload: unknown): void {
  info('scenario completed', { scenario: name, payload });
}

function logScenarioFailure(name: string, err: unknown): void {
  error('scenario failed', {
    scenario: name,
    error: err instanceof Error ? err.message : String(err)
  });
}

async function executeScenario(res: Response, scenarioName: string, runner: () => Promise<unknown>): Promise<void> {
  logScenarioStart(scenarioName);

  try {
    const result = await runner();
    logScenarioSuccess(scenarioName, { status: 'ok' });
    res.status(200).json(result);
  } catch (err) {
    logScenarioFailure(scenarioName, err);
    res.status(500).json({
      scenario: scenarioName,
      status: 'error',
      error: err instanceof Error ? err.message : String(err)
    });
  }
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value) ?? 'null';
}

function normalizeDedupOrder(body: unknown): DedupOrderPayload | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const source = body as Record<string, unknown>;
  const orderId = typeof source.orderId === 'string' ? source.orderId.trim() : '';
  if (!orderId) {
    return null;
  }

  const customerTier = typeof source.customerTier === 'string' && source.customerTier.trim() ? source.customerTier.trim() : 'standard';
  const rawItems = Array.isArray(source.items) ? source.items : [];

  const items = rawItems
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      const sku = typeof record.sku === 'string' ? record.sku.trim() : '';
      const quantity = typeof record.quantity === 'number' ? record.quantity : Number.parseInt(String(record.quantity ?? ''), 10);
      if (!sku || !Number.isInteger(quantity) || quantity <= 0) {
        return null;
      }

      return {
        sku,
        quantity
      };
    })
    .filter((item): item is DedupOrderLineItem => item !== null)
    .sort((left, right) => left.sku.localeCompare(right.sku) || left.quantity - right.quantity);

  if (items.length === 0) {
    return null;
  }

  return {
    orderId,
    customerTier,
    items
  };
}

function parseTimeoutMs(raw: unknown, fallback: number, max: number): number {
  if (typeof raw !== 'string') {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    sampleId: config.sampleId
  });
});

app.get('/expectations', (_req, res) => {
  res.type('application/json').send(readExpectationsJson(config));
});

app.get('/deps/http', async (_req, res) => executeScenario(res, 'deps-http', () => runHttpScenario(config)));
app.get('/deps/http2', async (_req, res) => executeScenario(res, 'deps-http2', () => runHttp2Scenario(config)));
app.get('/deps/grpc', async (_req, res) => executeScenario(res, 'deps-grpc', () => runGrpcScenario(config)));
app.get('/deps/mysql', async (_req, res) => executeScenario(res, 'deps-mysql', () => runMySqlScenario(config)));
app.get('/deps/postgres', async (_req, res) => executeScenario(res, 'deps-postgres', () => runPostgresScenario(config)));
app.get('/deps/mongo', async (_req, res) => executeScenario(res, 'deps-mongo', () => runMongoScenario(config)));
app.get('/deps/redis', async (_req, res) => executeScenario(res, 'deps-redis', () => runRedisScenario(config)));
app.get('/deps/kafka', async (_req, res) => executeScenario(res, 'deps-kafka', () => runKafkaScenario(config)));
app.get('/deps/sqs', async (_req, res) => executeScenario(res, 'deps-sqs', () => runSqsScenario(config)));
app.get('/deps/generic', async (_req, res) => executeScenario(res, 'deps-generic', () => runGenericScenario(config)));
app.get('/deps/all', async (_req, res) => executeScenario(res, 'deps-all', () => runAllDependencyScenarios(config)));

app.get('/dedup/catalog', (req, res) => {
  const itemId = typeof req.query.id === 'string' ? req.query.id : 'alpha';
  logScenarioStart('dedup/catalog');

  const payload = {
    scenario: 'dedup/catalog',
    itemId,
    description: `catalog-${itemId}`,
    stablePrice: 42
  };

  logScenarioSuccess('dedup/catalog', payload);
  res.json(payload);
});

app.post('/dedup/order', (req, res) => {
  const normalizedOrder = normalizeDedupOrder(req.body);
  if (!normalizedOrder) {
    return res.status(400).json({
      scenario: 'dedup/order',
      error: 'orderId and at least one valid item are required'
    });
  }

  const dedupKey = req.get('x-matrix-dedup-key')?.trim() || normalizedOrder.orderId;
  logScenarioStart('dedup/order');

  const payload = {
    scenario: 'dedup/order',
    dedupKey,
    order: normalizedOrder,
    stableFingerprint: stableSerialize({
      dedupKey,
      order: normalizedOrder
    })
  };

  logScenarioSuccess('dedup/order', payload);
  return res.json(payload);
});

app.post('/async/catalog-sync', (req, res) => {
  const jobId = typeof req.body?.jobId === 'string' ? req.body.jobId.trim() : '';
  const catalogId = typeof req.body?.catalogId === 'string' && req.body.catalogId.trim() ? req.body.catalogId.trim() : 'alpha';
  const correlationId = req.get('x-matrix-correlation-id')?.trim() || jobId;

  if (!jobId) {
    return res.status(400).json({
      scenario: 'async/catalog-sync',
      error: 'jobId is required'
    });
  }

  logScenarioStart('async/catalog-sync');
  const payload = startCatalogSyncJob(config, {
    jobId,
    catalogId,
    correlationId
  });
  logScenarioSuccess('async/catalog-sync', payload);
  return res.status(202).json(payload);
});

app.get('/async/catalog-sync/:jobId', (req, res) => {
  const payload = getCatalogSyncJob(req.params.jobId);
  if (!payload) {
    return res.status(404).json({
      scenario: 'async/catalog-sync',
      error: 'job not found',
      jobId: req.params.jobId
    });
  }

  return res.json(payload);
});

app.get('/async/catalog-sync/:jobId/wait', async (req, res) => {
  const timeoutMs = parseTimeoutMs(req.query.timeoutMs, 5000, 15000);
  logScenarioStart('async/catalog-sync/wait');

  const payload = await waitForCatalogSyncJob(req.params.jobId, timeoutMs);
  if (!payload) {
    logScenarioFailure('async/catalog-sync/wait', 'job not found');
    return res.status(404).json({
      scenario: 'async/catalog-sync/wait',
      error: 'job not found',
      jobId: req.params.jobId
    });
  }

  if (payload.status === 'completed') {
    logScenarioSuccess('async/catalog-sync/wait', {
      jobId: payload.jobId,
      status: payload.status,
      completedScenarios: payload.completedScenarios
    });
    return res.json(payload);
  }

  if (payload.status === 'failed') {
    logScenarioFailure('async/catalog-sync/wait', payload.error ?? 'async job failed');
    return res.status(500).json(payload);
  }

  logScenarioFailure('async/catalog-sync/wait', `timed out after ${timeoutMs}ms`);
  return res.status(504).json({
    ...payload,
    scenario: 'async/catalog-sync/wait',
    error: `timed out after ${timeoutMs}ms`
  });
});

app.get('/noise/runtime', (_req, res) => {
  const payload = {
    scenario: 'noise/runtime',
    runtime: {
      requestId: crypto.randomUUID(),
      servedAt: new Date().toISOString()
    }
  };

  res.setHeader('x-matrix-generated-at', new Date().toISOString());
  res.setHeader('etag', `"${crypto.randomUUID()}"`);
  logScenarioSuccess('noise/runtime', payload);
  res.json(payload);
});

app.get('/expected-fail/time-window', (req, res) => {
  const ts = typeof req.query.ts === 'string' ? Number.parseInt(req.query.ts, 10) : Number.NaN;
  const now = Math.floor(Date.now() / 1000);

  if (Number.isNaN(ts)) {
    return res.status(400).json({
      scenario: 'expected-fail/time-window',
      error: 'ts query parameter is required'
    });
  }

  const diff = Math.abs(now - ts);
  if (diff > 2) {
    return res.status(400).json({
      scenario: 'expected-fail/time-window',
      diff,
      now
    });
  }

  return res.status(200).json({
    scenario: 'expected-fail/time-window',
    diff,
    now
  });
});

const httpServer = app.listen(config.port, () => {
  info('http server listening', {
    port: config.port,
    sampleId: config.sampleId
  });
});

const proto = loadMatrixProto(config.protoPath);
const grpcServer = new grpc.Server();

grpcServer.addService(proto.dependencymatrix.DependencyMatrix.service, {
  Ping(
    call: grpc.ServerUnaryCall<{ name: string }, { message: string; sampleId: string }>,
    callback: grpc.sendUnaryData<{ message: string; sampleId: string }>
  ) {
    callback(null, {
      message: `pong:${call.request.name || 'matrix'}`,
      sampleId: config.sampleId
    });
  },

  async RunDependencyScenario(
    call: grpc.ServerUnaryCall<{ scenario: string }, { scenario: string; status: string; payloadJson: string }>,
    callback: grpc.sendUnaryData<{ scenario: string; status: string; payloadJson: string }>
  ) {
    try {
      const result = await runNamedScenario(config, call.request.scenario);
      callback(null, {
        scenario: result.scenario,
        status: 'ok',
        payloadJson: JSON.stringify(result.payload)
      });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: err instanceof Error ? err.message : String(err),
        name: 'RunDependencyScenarioError'
      });
    }
  }
});

grpcServer.bindAsync(`0.0.0.0:${config.grpcPort}`, grpc.ServerCredentials.createInsecure(), (err) => {
  if (err) {
    error('grpc server failed to bind', { error: err.message });
    process.exitCode = 1;
    return;
  }

  grpcServer.start();
  info('grpc server listening', {
    port: config.grpcPort
  });
});

const shutdown = (): void => {
  info('shutdown started');
  grpcServer.tryShutdown(() => {
    httpServer.close(() => {
      info('shutdown complete');
      process.exit(0);
    });
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
