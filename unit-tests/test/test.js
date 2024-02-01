const { NewContext } = require('typescript-sdk/dist/mock/mock');
const { fullName, email } = require('../src/index');
const { describe, test } = require('mocha');
const assert = require('assert');

describe('Mocking external calls from unit tests', () => {
  test('fullName()', async () => {
    NewContext({ Mode: 'test', Name: 'fullNameMock'});
    const name = await fullName()
    assert.equal(name, 'Janet Weaver')
 })

  test('email()', async () => {
    NewContext({ Mode: 'test', Name: 'emailMock'});
    const emailAddress = await email()
    assert.equal(emailAddress, 'janet.weaver@reqres.in')
 })
})
