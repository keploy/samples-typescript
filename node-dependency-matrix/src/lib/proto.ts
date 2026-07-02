import path from 'node:path';

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const loaderOptions: protoLoader.Options = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

export interface FixtureGrpcClient extends grpc.Client {
  GetDependencyQuote(
    request: { scenario: string },
    callback: (error: grpc.ServiceError | null, response: { scenario: string; message: string; unixTime: string | number }) => void
  ): void;
}

export interface MatrixGrpcClient extends grpc.Client {
  Ping(
    request: { name: string },
    callback: (error: grpc.ServiceError | null, response: { message: string; sampleId: string }) => void
  ): void;

  RunDependencyScenario(
    request: { scenario: string },
    callback: (error: grpc.ServiceError | null, response: { scenario: string; status: string; payloadJson: string }) => void
  ): void;
}

export interface LoadedProto {
  dependencymatrix: {
    DependencyFixture: grpc.ServiceClientConstructor;
    DependencyMatrix: grpc.ServiceClientConstructor;
  };
}

export function loadMatrixProto(protoPath: string): LoadedProto {
  const absolutePath = path.resolve(protoPath);
  const packageDefinition = protoLoader.loadSync(absolutePath, loaderOptions);
  return grpc.loadPackageDefinition(packageDefinition) as unknown as LoadedProto;
}
