const { describe, test, before } = require('mocha');
const assert = require('assert');

const { NewContext } = require('typescript-sdk/dist/mock/mock');

require('typescript-sdk/dist/integrations/node-fetch/require');
const fetch = require('node-fetch');

describe('Generating of mocks for external dependencies', function () {
  before(() => {
    // Setting mode to record before using fetch
    NewContext({ Mode: 'record', Name: 'testing-auto-mocks' });
  });

  test('Generating node-fetch mocks', async () => {
    const res = await fetch('https://reqres.in/api/users/2');

    assert.equal(res.status, 200);

    const resBody = JSON.parse(await res.text());
    console.log(resBody);
  });
});
