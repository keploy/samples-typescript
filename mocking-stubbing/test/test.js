const { describe, test, before } = require('mocha');
var { NewContext } = require('typescript-sdk/dist/mock/mock');
require('typescript-sdk/dist/integrations/node-fetch/require');
const fetch = require('node-fetch');

describe('Generating of mocks for external dependencies', function () {
  before(() => {
    // Setting mode to record before using fetch
    NewContext({ Mode: 'record', Name: 'testing-auto-mocks' });
  });

  test('Generating node-fetch mocks', () => {
    fetch('https://reqres.in/api/users/2')
      .then((res) => res.text())
      .then((text) => rs.send(text));
  });
});
