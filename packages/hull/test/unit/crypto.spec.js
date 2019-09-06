const { encrypt, decrypt } = require("../../src/utils/crypto");
const middleware = require("../../src/middlewares/credentials-from-query");
const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);

describe("crypto", () => {
  const secret = "topsecret";
  const configuration = {
    organization: "123456789.hullbeta.io",
    id: "this_is_a_ship_id",
    secret: "secret"
  };

  it("should encrypt and decrypt the configuration object", () => {
    const encrypted = encrypt(configuration, secret);
    const decrypted = decrypt(encrypted, secret);

    expect(decrypted).to.deep.equal(configuration);
    expect(encrypted).to.not.equal(configuration);
  });

  it("should decrypt req.query.config and call next()", () => {
    const encrypted = encrypt(configuration, secret);
    const req = {
      query: {
        token: encrypted
      },
      hull: {
        connectorConfig: {
          hostSecret: secret
        }
      }
    };
    const res = {};
    const next = sinon.spy();
    const mw = middleware();
    return mw(req, res, next).then(() => {
      expect(req.hull.clientCredentials).to.deep.equal(configuration);
      expect(next).to.have.callCount(1);
      return Promise.resolve();
    });

  });
});
