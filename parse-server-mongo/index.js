// Minimal Parse Server bootstrap. The orchestration layer for an e2e
// reproducer of the mongo/v2 boot-phase tiebreaker bug — parse-server's
// own boot eager-index sweep is what the recording captures, and
// flow.sh's POST /classes/GameScore is what mutates _SCHEMA mid-stream.
const { ParseServer } = require('parse-server');
const express = require('express');

const app = express();
const port = parseInt(process.env.PORT || '1337', 10);
const mountPath = process.env.PARSE_MOUNT || '/parse';

const parseServer = new ParseServer({
  databaseURI: process.env.PARSE_SERVER_DATABASE_URI || 'mongodb://mongo:27017/parse',
  appId: process.env.PARSE_SERVER_APPLICATION_ID || 'keploy-parse-app',
  masterKey: process.env.PARSE_SERVER_MASTER_KEY || 'keploy-parse-master',
  masterKeyIps: (process.env.PARSE_SERVER_MASTER_KEY_IPS || '0.0.0.0/0,::0').split(','),
  serverURL: process.env.PARSE_SERVER_SERVER_URL || `http://localhost:${port}${mountPath}`,
  allowCustomObjectId: process.env.PARSE_SERVER_ALLOW_CUSTOM_OBJECT_ID === '1',
});

(async () => {
  await parseServer.start();
  app.use(mountPath, parseServer.app);
  app.listen(port, () => {
    console.log(`parse-server-mongo listening on :${port}${mountPath}`);
  });
})();
