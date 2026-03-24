import fs from 'node:fs';
import http2 from 'node:http2';
import https from 'node:https';
import tls from 'node:tls';
import { promisify } from 'node:util';
import { URL } from 'node:url';

import { DeleteMessageCommand, ReceiveMessageCommand, SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import * as grpc from '@grpc/grpc-js';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import { MongoClient } from 'mongodb';
import mysql from 'mysql2/promise';
import { Client as PgClient } from 'pg';
import { NodeHttpHandler } from '@smithy/node-http-handler';

import { AppConfig } from './config';
import { error, info } from './log';
import { FixtureGrpcClient, loadMatrixProto } from './proto';

type ScenarioPayload = Record<string, unknown>;

export interface ScenarioResult {
  scenario: string;
  protocol: string;
  payload: ScenarioPayload;
}

function readCaBundle(config: AppConfig): Buffer {
  return fs.readFileSync(config.caBundlePath);
}

export async function runHttpScenario(config: AppConfig): Promise<ScenarioResult> {
  const target = new URL(`${config.fixtureHttpsBase}/http-json?source=app`);
  const payload = await new Promise<{ status: number; body: ScenarioPayload }>((resolve, reject) => {
    const request = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method: 'GET',
        ca: readCaBundle(config),
        rejectUnauthorized: true
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: response.statusCode ?? 0,
            body: JSON.parse(body) as ScenarioPayload
          });
        });
      }
    );

    request.on('error', reject);
    request.end();
  });

  return {
    scenario: 'deps-http',
    protocol: 'Http',
    payload: {
      status: payload.status,
      body: payload.body
    }
  };
}

export async function runHttp2Scenario(config: AppConfig): Promise<ScenarioResult> {
  const client = http2.connect(config.fixtureHttp2Origin, {
    ca: readCaBundle(config)
  });

  try {
    const payload = await new Promise<string>((resolve, reject) => {
      const request = client.request({
        ':method': 'GET',
        ':path': '/http2-ping'
      });

      const chunks: Buffer[] = [];

      request.on('response', () => undefined);
      request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      request.on('error', reject);
      request.end();
    });

    return {
      scenario: 'deps-http2',
      protocol: 'Http2',
      payload: JSON.parse(payload) as ScenarioPayload
    };
  } finally {
    client.close();
  }
}

export async function runGrpcScenario(config: AppConfig): Promise<ScenarioResult> {
  const proto = loadMatrixProto(config.protoPath);
  const ClientCtor = proto.dependencymatrix.DependencyFixture;
  const client = new ClientCtor(
    config.fixtureGrpcTarget,
    grpc.credentials.createSsl(readCaBundle(config))
  ) as unknown as FixtureGrpcClient;
  const getQuote = promisify<{ scenario: string }, { scenario: string; message: string; unixTime: string | number }>(
    client.GetDependencyQuote.bind(client)
  );

  try {
    const response = await getQuote({ scenario: 'deps-grpc' });

    return {
      scenario: 'deps-grpc',
      protocol: 'gRPC',
      payload: {
        scenario: response.scenario,
        message: response.message,
        unixTime: Number(response.unixTime)
      }
    };
  } finally {
    client.close();
  }
}

export async function runMySqlScenario(config: AppConfig): Promise<ScenarioResult> {
  const connection = await mysql.createConnection({
    uri: config.mysqlUrl
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS matrix_events (
        sample_key VARCHAR(64) PRIMARY KEY,
        sample_value VARCHAR(128) NOT NULL,
        touched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(
      `
      INSERT INTO matrix_events (sample_key, sample_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE sample_value = VALUES(sample_value)
      `,
      ['mysql-scenario', 'mysql-value']
    );

    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT sample_key, sample_value FROM matrix_events WHERE sample_key = ?',
      ['mysql-scenario']
    );

    return {
      scenario: 'deps-mysql',
      protocol: 'MySQL',
      payload: {
        rowCount: rows.length,
        row: rows[0] ?? null
      }
    };
  } finally {
    await connection.end();
  }
}

export async function runPostgresScenario(config: AppConfig): Promise<ScenarioResult> {
  const client = new PgClient({
    connectionString: config.postgresUrl
  });

  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS matrix_events (
        sample_key TEXT PRIMARY KEY,
        sample_value TEXT NOT NULL
      )
    `);

    await client.query(
      `
      INSERT INTO matrix_events (sample_key, sample_value)
      VALUES ($1, $2)
      ON CONFLICT (sample_key) DO UPDATE SET sample_value = EXCLUDED.sample_value
      `,
      ['postgres-scenario', 'postgres-value']
    );

    const result = await client.query(
      'SELECT sample_key, sample_value FROM matrix_events WHERE sample_key = $1',
      ['postgres-scenario']
    );

    return {
      scenario: 'deps-postgres',
      protocol: 'PostgresV2',
      payload: {
        rowCount: result.rowCount,
        row: result.rows[0] ?? null
      }
    };
  } finally {
    await client.end();
  }
}

export async function runMongoScenario(config: AppConfig): Promise<ScenarioResult> {
  const client = new MongoClient(config.mongoUrl, {
    tlsCAFile: config.caBundlePath
  });
  await client.connect();

  try {
    const database = client.db('matrix');
    const collection = database.collection('events');

    await collection.updateOne(
      { sampleKey: 'mongo-scenario' },
      {
        $set: {
          sampleValue: 'mongo-value',
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    const document = await collection.findOne({ sampleKey: 'mongo-scenario' }, { projection: { _id: 0 } });

    return {
      scenario: 'deps-mongo',
      protocol: 'Mongo',
      payload: document ?? {}
    };
  } finally {
    await client.close();
  }
}

export async function runRedisScenario(config: AppConfig): Promise<ScenarioResult> {
  const client = new Redis(config.redisUrl, {
    tls: {
      ca: readCaBundle(config),
      rejectUnauthorized: true,
      checkServerIdentity: () => undefined
    },
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });
  client.on('error', () => undefined);

  await client.connect();

  try {
    await client.set('matrix:redis-scenario', 'redis-value');
    const value = await client.get('matrix:redis-scenario');

    return {
      scenario: 'deps-redis',
      protocol: 'Redis',
      payload: {
        value
      }
    };
  } finally {
    client.disconnect();
  }
}

export async function runKafkaScenario(config: AppConfig): Promise<ScenarioResult> {
  const kafka = new Kafka({
    clientId: config.sampleId,
    brokers: config.kafkaBrokers,
    ssl: false,
    retry: {
      retries: 0
    }
  });

  const admin = kafka.admin();

  await admin.connect();

  try {
    const cluster = await admin.describeCluster();
    const topics = await admin.listTopics();

    return {
      scenario: 'deps-kafka',
      protocol: 'Kafka',
      payload: {
        brokerCount: cluster.brokers.length,
        controller: cluster.controller ?? null,
        topicCount: topics.length,
        hasMatrixTopic: topics.includes(config.kafkaTopic)
      }
    };
  } finally {
    await admin.disconnect().catch(() => undefined);
  }
}

export async function runSqsScenario(config: AppConfig): Promise<ScenarioResult> {
  const client = new SQSClient({
    endpoint: config.sqsEndpoint,
    region: config.sqsRegion,
    md5: false,
    requestHandler: new NodeHttpHandler({
      httpsAgent: new https.Agent({
        ca: readCaBundle(config),
        rejectUnauthorized: true
      })
    }),
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  });

  const sendResult = await client.send(
    new SendMessageCommand({
      QueueUrl: config.sqsQueueUrl,
      MessageBody: JSON.stringify({
        sampleId: config.sampleId,
        scenario: 'deps-sqs',
        sentAt: new Date().toISOString()
      })
    })
  );

  const receiveResult = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: config.sqsQueueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 0
    })
  );

  const receiptHandle = receiveResult.Messages?.[0]?.ReceiptHandle;
  if (receiptHandle) {
    await client.send(
      new DeleteMessageCommand({
        QueueUrl: config.sqsQueueUrl,
        ReceiptHandle: receiptHandle
      })
    );
  }

  return {
    scenario: 'deps-sqs',
    protocol: 'SQS',
    payload: {
      sentMessageId: sendResult.MessageId ?? null,
      receivedMessages: receiveResult.Messages?.length ?? 0
    }
  };
}

export async function runGenericScenario(config: AppConfig): Promise<ScenarioResult> {
  const payload = await new Promise<string>((resolve, reject) => {
    let settled = false;
    const socket = tls.connect(
      {
        host: config.fixtureGenericHost,
        port: config.fixtureGenericPort,
        ca: readCaBundle(config),
        rejectUnauthorized: true,
        checkServerIdentity: () => undefined
      },
      () => {
        socket.end('matrix-generic\n');
      }
    );

    const fail = (err: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      reject(err);
    };

    socket.setTimeout(3000, () => {
      fail(new Error('generic socket timeout'));
    });

    socket.once('data', (data) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(data.toString('utf8').trim());
      socket.destroy();
    });

    socket.once('end', () => {
      fail(new Error('generic socket closed before response'));
    });

    socket.once('error', (err) => {
      fail(err);
    });
  });

  return {
    scenario: 'deps-generic',
    protocol: 'Generic',
    payload: {
      echoed: payload
    }
  };
}

export async function runNamedScenario(config: AppConfig, scenario: string): Promise<ScenarioResult> {
  switch (scenario) {
    case 'http':
    case 'deps-http':
      return runHttpScenario(config);
    case 'http2':
    case 'deps-http2':
      return runHttp2Scenario(config);
    case 'grpc':
    case 'deps-grpc':
      return runGrpcScenario(config);
    case 'mysql':
    case 'deps-mysql':
      return runMySqlScenario(config);
    case 'postgres':
    case 'deps-postgres':
      return runPostgresScenario(config);
    case 'mongo':
    case 'deps-mongo':
      return runMongoScenario(config);
    case 'redis':
    case 'deps-redis':
      return runRedisScenario(config);
    case 'kafka':
    case 'deps-kafka':
      return runKafkaScenario(config);
    case 'sqs':
    case 'deps-sqs':
      return runSqsScenario(config);
    case 'generic':
    case 'deps-generic':
      return runGenericScenario(config);
    default:
      throw new Error(`unsupported scenario: ${scenario}`);
  }
}

export async function runAllDependencyScenarios(config: AppConfig): Promise<ScenarioResult[]> {
  const runners = [
    runHttpScenario,
    runHttp2Scenario,
    runGrpcScenario,
    runMySqlScenario,
    runPostgresScenario,
    runMongoScenario,
    runRedisScenario,
    runKafkaScenario,
    runSqsScenario,
    runGenericScenario
  ];

  const results: ScenarioResult[] = [];
  for (const runner of runners) {
    try {
      results.push(await runner(config));
    } catch (err) {
      error('dependency scenario failed', {
        scenario: runner.name,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
  return results;
}
