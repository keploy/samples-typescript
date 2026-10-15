import fs from 'node:fs';
import http2 from 'node:http2';
import path from 'node:path';
import tls from 'node:tls';

import * as grpc from '@grpc/grpc-js';
import express from 'express';

import { loadConfig } from '../lib/config';
import { info } from '../lib/log';
import { loadMatrixProto } from '../lib/proto';

const config = loadConfig();
const cert = fs.readFileSync(config.proxyCertPath);
const key = fs.readFileSync(config.proxyKeyPath);

const app = express();
app.get('/http-json', (req, res) => {
  res.json({
    source: 'fixture-service',
    protocol: 'http',
    echo: req.query.source ?? 'unknown'
  });
});

const httpsServer = tls.createServer({ cert, key }, (socket) => {
  socket.once('data', (data) => {
    const input = data.toString('utf8');
    if (input.startsWith('GET ') || input.startsWith('POST ')) {
      socket.destroy();
    }
  });
});
httpsServer.close();

const httpsApp = app.listen(0);
httpsApp.close();

require('node:https')
  .createServer({ cert, key }, app)
  .listen(8443, () => {
    info('fixture https server listening', { port: 8443 });
  });

http2
  .createSecureServer({ cert, key })
  .on('stream', (stream, headers) => {
    if (headers[':path'] === '/http2-ping') {
      stream.respond({
        ':status': 200,
        'content-type': 'application/json'
      });
      stream.end(
        JSON.stringify({
          source: 'fixture-service',
          protocol: 'http2',
          path: '/http2-ping'
        })
      );
      return;
    }

    stream.respond({ ':status': 404 });
    stream.end();
  })
  .listen(9443, () => {
    info('fixture http2 server listening', { port: 9443 });
  });

tls
  .createServer({ cert, key }, (socket) => {
    socket.on('data', (data) => {
      const response = `fixture-ack:${data.toString('utf8').trim()}\n`;
      socket.write(response);
    });
  })
  .listen(9445, () => {
    info('fixture generic tls server listening', { port: 9445 });
  });

const proto = loadMatrixProto(config.protoPath);
const grpcServer = new grpc.Server();
grpcServer.addService(proto.dependencymatrix.DependencyFixture.service, {
  GetDependencyQuote(
    call: grpc.ServerUnaryCall<{ scenario: string }, { scenario: string; message: string; unixTime: number }>,
    callback: grpc.sendUnaryData<{ scenario: string; message: string; unixTime: number }>
  ) {
    callback(null, {
      scenario: call.request.scenario || 'unknown',
      message: 'fixture-service-ready',
      unixTime: Math.floor(Date.now() / 1000)
    });
  }
});

grpcServer.bindAsync(
  '0.0.0.0:50051',
  grpc.ServerCredentials.createSsl(null, [{ cert_chain: cert, private_key: key }]),
  (err) => {
    if (err) {
      throw err;
    }
    grpcServer.start();
    info('fixture grpc server listening', { port: 50051 });
  }
);
