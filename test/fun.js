const { describe, it, before } = require('mocha');
const assert = require('assert');
const { NewContext } = require('typescript-sdk/dist/mock/mock');
const fetch = require('node-fetch');

describe('Mocking external API calls with typescript-sdk and node-fetch', () => {
  before(() => {
    NewContext({ Mode: 'record', Name: 'mocks' });
  });

  it('should return a mocked response', async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const json = await response.json();
    assert.strictEqual(json.userId, 1);
  });
});