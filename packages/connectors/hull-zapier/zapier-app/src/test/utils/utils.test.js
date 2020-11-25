const _ = require("lodash");
const { isValidClaims } = require("../../lib/utils");
require('should');

describe('Utils Test', () => {
  it('User claims email and external id are valid', async () => {
    const claims = {
      email: "mail@gmail.com",
      external_id: "2345345"
    };

    const isValid = isValidClaims(claims);
    should.equal(isValid, true);
  });

  it('User claims anonymous id is valid', async () => {
    const claims = {
      anonymous_id: "13241"
    };

    const isValid = isValidClaims(claims);
    should.equal(isValid, true);
  });

  it('User claims email is valid', async () => {
    const claims = {
      email: "mail@gmail.com"
    };

    const isValid = isValidClaims(claims);
    should.equal(isValid, true);
  });

  it('User claims external id is  valid', async () => {
    const claims = {
      external_id: "2345345"
    };

    const isValid = isValidClaims(claims);
    should.equal(isValid, true);
  });

  it('User claims external id and email are not valid', async () => {
    const claims = {
      email: "mail@gmail",
      external_id: "2345345"
    };

    const isValid = isValidClaims(claims);
    should.equal(isValid, true);
  });

  it('User claims email is not valid', async () => {
    const claims = {
      email: null,
    };

    const isValid = isValidClaims(claims);
    should.equal(isValid, false);
  });

  it('User claims undefined is not valid', async () => {
    const claims = {};

    const isValid = isValidClaims(claims);
    should.equal(isValid, false);
  });

  it('Account claims domain is valid', async () => {
    const claims = {
      domain: "not cleaning claims",
      external_id: null
    };

    const isValid = isValidClaims(claims);
    should.equal(isValid, true);
  });
});
