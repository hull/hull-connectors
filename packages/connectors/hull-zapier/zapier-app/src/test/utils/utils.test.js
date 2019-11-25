const _ = require("lodash");
const { isValidClaim } = require("../../lib/utils");
require('should');

describe('Utils Test', () => {
  it('User claims email and external id are valid', async () => {
    const claims = {
      email: "mail@gmail.com",
      external_id: "2345345"
    };

    const isValid = isValidClaim(claims);
    should.equal(isValid, true);
  });

  it('User claims email is valid', async () => {
    const claims = {
      email: "mail@gmail.com"
    };

    const isValid = isValidClaim(claims);
    should.equal(isValid, true);
  });

  it('User claims external id is  valid', async () => {
    const claims = {
      external_id: "2345345"
    };

    const isValid = isValidClaim(claims);
    should.equal(isValid, true);
  });

  it('User claims external id and email are not valid', async () => {
    const claims = {
      email: "mail@gmail",
      external_id: "2345345"
    };

    const isValid = isValidClaim(claims);
    should.equal(isValid, false);
  });

  it('User claims email is not valid', async () => {
    const claims = {
      email: "mail@gmail"
    };

    const isValid = isValidClaim(claims);
    should.equal(isValid, false);
  });

  it('User claims undefined is not valid', async () => {
    const claims = {};

    const isValid = isValidClaim(claims);
    should.equal(isValid, false);
  });
});
