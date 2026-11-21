// Minimal Parse Server bootstrap. The orchestration layer for an e2e
// reproducer of the mongo/v2 boot-phase tiebreaker bug — parse-server's
// own boot eager-index sweep is what the recording captures, and
// flow.sh's POST /classes/GameScore is what mutates _SCHEMA mid-stream.
const { ParseServer, ParseGraphQLServer } = require('parse-server');
const express = require('express');

const app = express();
const port = parseInt(process.env.PORT || '1337', 10);
const mountPath = process.env.PARSE_MOUNT || '/parse';

const parseServer = new ParseServer({
  databaseURI: process.env.PARSE_SERVER_DATABASE_URI || 'mongodb://mongo:27017/parse',
  appId: process.env.PARSE_SERVER_APPLICATION_ID || 'keploy-parse-app',
  masterKey: process.env.PARSE_SERVER_MASTER_KEY || 'keploy-parse-master',
  // Any client may use the master key: flow.sh sends it on almost every call.
  // `::/0`, not the `::0` parse-server's docs suggest: parse-server 8.x reads
  // `::/0` and `::` as "any IPv6 address" but `::0` as the one address `::`.
  // And every client is IPv6 here. app.listen() binds the dual-stack `::`, so
  // an IPv4 client arrives as `::ffff:a.b.c.d`, which `0.0.0.0/0` does not
  // cover; with `::0` all master-key calls were refused with a 403.
  masterKeyIps: (process.env.PARSE_SERVER_MASTER_KEY_IPS || '0.0.0.0/0,::/0').split(','),
  serverURL: process.env.PARSE_SERVER_SERVER_URL || `http://localhost:${port}${mountPath}`,
  allowCustomObjectId: process.env.PARSE_SERVER_ALLOW_CUSTOM_OBJECT_ID === '1',
  // A file keeps the name it was uploaded as, instead of getting a random
  // 32-hex prefix, so the files flow.sh uploads answer with the same name in
  // every run (and the same url for the same Host, which a replay resends),
  // and a recorded test of them replays.
  preserveFileName: true,
});

(async () => {
  await parseServer.start();
  // GraphQL at <mount>/graphql, where flow.sh sends its GraphQL calls. A
  // ParseServer mounted as middleware serves REST only; ParseServer.startApp
  // would mount GraphQL, at /graphql, but only with mountGraphQL. Mounted
  // before the REST app so that the REST app's own handling of the path (its
  // CORS preflight answer) never comes first.
  new ParseGraphQLServer(parseServer, { graphQLPath: `${mountPath}/graphql` }).applyGraphQL(app);
  app.use(mountPath, parseServer.app);
  app.listen(port, () => {
    console.log(`parse-server-mongo listening on :${port}${mountPath}`);
  });
})();
