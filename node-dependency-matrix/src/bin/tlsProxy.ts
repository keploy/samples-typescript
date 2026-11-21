import fs from 'node:fs';
import net from 'node:net';
import tls from 'node:tls';

import { loadConfig } from '../lib/config';
import { error, info } from '../lib/log';

const config = loadConfig();
const listenPort = Number.parseInt(process.env.LISTEN_PORT ?? '0', 10);
const targetHost = process.env.TARGET_HOST;
const targetPort = Number.parseInt(process.env.TARGET_PORT ?? '0', 10);

if (!listenPort || !targetHost || !targetPort) {
  throw new Error('LISTEN_PORT, TARGET_HOST and TARGET_PORT are required');
}

const cert = fs.readFileSync(config.proxyCertPath);
const key = fs.readFileSync(config.proxyKeyPath);

const server = tls.createServer({ cert, key }, (sourceSocket) => {
  const targetSocket = net.connect(targetPort, targetHost, () => {
    sourceSocket.pipe(targetSocket);
    targetSocket.pipe(sourceSocket);
  });

  sourceSocket.on('error', (err) => {
    error('tls proxy source socket error', {
      listenPort,
      targetHost,
      targetPort,
      error: err.message
    });
  });

  targetSocket.on('error', (err) => {
    error('tls proxy target socket error', {
      listenPort,
      targetHost,
      targetPort,
      error: err.message
    });
    sourceSocket.destroy(err);
  });
});

server.listen(listenPort, '0.0.0.0', () => {
  info('tls proxy listening', {
    listenPort,
    targetHost,
    targetPort
  });
});
