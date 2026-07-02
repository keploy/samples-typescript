import { AppConfig } from './config';
import { runHttpScenario, runRedisScenario, runSqsScenario } from './dependencies';
import { error, info } from './log';

type CatalogSyncStatus = 'queued' | 'running' | 'completed' | 'failed';

interface CatalogSyncJobState {
  jobId: string;
  catalogId: string;
  correlationId: string;
  status: CatalogSyncStatus;
  plannedScenarios: string[];
  completedScenarios: string[];
  protocols: string[];
  error?: string;
}

export interface CatalogSyncJobSnapshot {
  scenario: 'async/catalog-sync';
  jobId: string;
  catalogId: string;
  correlationId: string;
  status: CatalogSyncStatus;
  plannedScenarios: string[];
  completedScenarios: string[];
  protocols: string[];
  error?: string;
}

interface CatalogSyncRequest {
  jobId: string;
  catalogId: string;
  correlationId: string;
}

const catalogSyncRunners = [
  ['deps-http', runHttpScenario],
  ['deps-redis', runRedisScenario],
  ['deps-sqs', runSqsScenario]
] as const;

const catalogSyncJobs = new Map<string, CatalogSyncJobState>();

function snapshotJob(state: CatalogSyncJobState): CatalogSyncJobSnapshot {
  return {
    scenario: 'async/catalog-sync',
    jobId: state.jobId,
    catalogId: state.catalogId,
    correlationId: state.correlationId,
    status: state.status,
    plannedScenarios: [...state.plannedScenarios],
    completedScenarios: [...state.completedScenarios],
    protocols: [...state.protocols],
    ...(state.error ? { error: state.error } : {})
  };
}

async function runCatalogSyncJob(config: AppConfig, state: CatalogSyncJobState): Promise<void> {
  state.status = 'running';
  info('async catalog sync started', {
    scenario: 'async/catalog-sync',
    jobId: state.jobId,
    catalogId: state.catalogId,
    correlationId: state.correlationId
  });

  try {
    for (const [_expectedScenario, runner] of catalogSyncRunners) {
      const result = await runner(config);
      state.completedScenarios.push(result.scenario);
      state.protocols.push(result.protocol);
    }

    state.status = 'completed';
    info('async catalog sync completed', { ...snapshotJob(state) });
  } catch (err) {
    state.status = 'failed';
    state.error = err instanceof Error ? err.message : String(err);
    error('async catalog sync failed', {
      scenario: 'async/catalog-sync',
      jobId: state.jobId,
      catalogId: state.catalogId,
      error: state.error
    });
  }
}

export function startCatalogSyncJob(config: AppConfig, request: CatalogSyncRequest): CatalogSyncJobSnapshot {
  const state: CatalogSyncJobState = {
    jobId: request.jobId,
    catalogId: request.catalogId,
    correlationId: request.correlationId,
    status: 'queued',
    plannedScenarios: catalogSyncRunners.map(([scenario]) => scenario),
    completedScenarios: [],
    protocols: []
  };

  catalogSyncJobs.set(state.jobId, state);
  setImmediate(() => {
    void runCatalogSyncJob(config, state);
  });

  return snapshotJob(state);
}

export function getCatalogSyncJob(jobId: string): CatalogSyncJobSnapshot | null {
  const job = catalogSyncJobs.get(jobId);
  return job ? snapshotJob(job) : null;
}

export async function waitForCatalogSyncJob(jobId: string, timeoutMs: number): Promise<CatalogSyncJobSnapshot | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const snapshot = getCatalogSyncJob(jobId);
    if (!snapshot) {
      return null;
    }

    if (snapshot.status === 'completed' || snapshot.status === 'failed') {
      return snapshot;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return getCatalogSyncJob(jobId);
}
