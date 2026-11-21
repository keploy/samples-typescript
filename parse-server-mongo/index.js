// Minimal Parse Server bootstrap. The orchestration layer for an e2e
// reproducer of the mongo/v2 boot-phase tiebreaker bug — parse-server's
// own boot eager-index sweep is what the recording captures, and
// flow.sh's POST /classes/GameScore is what mutates _SCHEMA mid-stream.
const { ParseServer, ParseGraphQLServer } = require('parse-server');
// express 5, parse-server 8.2.3's own. The GraphQL mount below runs
// parse-server's async header middleware on this app, and that middleware
// refuses a master key from an address masterKeyIps does not list by
// rejecting. express 5 hands the rejection to parse-server's error handler, a
// 403; express 4 drops it, and node exits on the unhandled rejection.
const express = require('express');

const app = express();
const port = parseInt(process.env.PORT || '1337', 10);
const mountPath = process.env.PARSE_MOUNT || '/parse';

const parseServer = new ParseServer({
  databaseURI: process.env.PARSE_SERVER_DATABASE_URI || 'mongodb://mongo:27017/parse',
  appId: process.env.PARSE_SERVER_APPLICATION_ID || 'keploy-parse-app',
  masterKey: process.env.PARSE_SERVER_MASTER_KEY || 'keploy-parse-master',
  // Only loopback may use the master key by default, parse-server's own
  // default: the master key is a published default here, and a client with it
  // can read and change everything, hooks included. docker-compose.yml
  // publishes the port on the host's loopback only and adds the compose
  // network's subnet: docker relays a client on the docker host from the
  // network's gateway, so the subnet admits only the host's own calls while
  // no other host can reach the port. Clients arrive as IPv6 here
  // (app.listen() binds the dual-stack `::`, so an IPv4 client is
  // `::ffff:a.b.c.d`), and an IPv4 entry matches its IPv4-mapped address.
  masterKeyIps: (process.env.PARSE_SERVER_MASTER_KEY_IPS || '127.0.0.1,::1').split(','),
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
  // express 5 hands a listen error (EADDRINUSE, EACCES) to this callback
  // instead of throwing it: exit on it, or the app would say it listens and
  // stay up serving nothing.
  app.listen(port, (err) => {
    if (err) {
      console.error(`parse-server-mongo cannot listen on :${port}:`, err);
      process.exit(1);
    }
    console.log(`parse-server-mongo listening on :${port}${mountPath}`);
  });
})();
