import fs from 'node:fs';
import path from 'node:path';

export interface AppConfig {
  port: number;
  grpcPort: number;
  sampleId: string;
  fixtureHttpsBase: string;
  fixtureHttp2Origin: string;
  fixtureGrpcTarget: string;
  fixtureGenericHost: string;
  fixtureGenericPort: number;
  mysqlUrl: string;
  postgresUrl: string;
  mongoUrl: string;
  redisUrl: string;
  kafkaBrokers: string[];
  kafkaTopic: string;
  sqsEndpoint: string;
  sqsQueueUrl: string;
  sqsRegion: string;
  caBundlePath: string;
  proxyCertPath: string;
  proxyKeyPath: string;
  expectationsPath: string;
  protoPath: string;
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function splitCsv(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) {
    return fallback;
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function loadConfig(): AppConfig {
  const workdir = process.cwd();
  const expectationsPath = path.join(workdir, 'fixtures', 'expected-values.json');
  const protoPath = path.join(workdir, 'proto', 'dependency_matrix.proto');

  return {
    port: readNumber('PORT', 8080),
    grpcPort: readNumber('GRPC_PORT', 9090),
    sampleId: process.env.SAMPLE_ID ?? 'node-dependency-matrix',
    fixtureHttpsBase: process.env.FIXTURE_HTTPS_BASE ?? 'https://fixture-service:8443',
    fixtureHttp2Origin: process.env.FIXTURE_HTTP2_ORIGIN ?? 'https://fixture-service:9443',
    fixtureGrpcTarget: process.env.FIXTURE_GRPC_TARGET ?? 'fixture-service:50051',
    fixtureGenericHost: process.env.FIXTURE_GENERIC_HOST ?? 'fixture-service',
    fixtureGenericPort: readNumber('FIXTURE_GENERIC_PORT', 9445),
    mysqlUrl: process.env.MYSQL_URL ?? 'mysql://root@mysql:3306/matrix',
    postgresUrl: process.env.POSTGRES_URL ?? 'postgresql://postgres@postgres:5432/matrix',
    mongoUrl: process.env.MONGO_URL ?? 'mongodb://mongo-tls:27017/matrix?tls=true',
    redisUrl: process.env.REDIS_URL ?? 'rediss://redis-tls:6380',
    kafkaBrokers: splitCsv(process.env.KAFKA_BROKERS, ['redpanda:9092']),
    kafkaTopic: process.env.KAFKA_TOPIC ?? 'matrix-events',
    sqsEndpoint: process.env.SQS_ENDPOINT ?? 'https://sqs-tls:4567',
    sqsQueueUrl: process.env.SQS_QUEUE_URL ?? 'https://sqs-tls:4567/000000000000/dependency-matrix',
    sqsRegion: process.env.SQS_REGION ?? 'us-east-1',
    caBundlePath: process.env.COMBINED_CA_CERT_PATH ?? process.env.NODE_EXTRA_CA_CERTS ?? '/tmp/node-dependency-matrix-ca-bundle.crt',
    proxyCertPath: process.env.TLS_CERT_PATH ?? '/etc/sample-certs/proxy.crt',
    proxyKeyPath: process.env.TLS_KEY_PATH ?? '/etc/sample-certs/proxy.key',
    expectationsPath,
    protoPath
  };
}

export function readExpectationsJson(config: AppConfig): string {
  return fs.readFileSync(config.expectationsPath, 'utf8');
}
