const { encrypt, decrypt, middleware } = require("../../server/lib/crypto");

describe("crypto", () => {
  const secret = "topsecret";
  const configuration = {
    organization: "123456789.hullbeta.io",
    ship: "this_is_a_ship_id",
    secret: "secret"
  };

  test("should encrypt and decrypt the configuration object", () => {
    const encrypted = encrypt(configuration, secret);
    const decrypted = decrypt(encrypted, secret);

    expect(decrypted).toEqual(configuration);
    expect(decrypted).not.toBe(configuration);
  });

  test("should decrypt req.query.config and call next()", () => {
    const encrypted = encrypt(configuration, secret);
    const req = {
      query: {
        conf: encrypted
      }
    };
    const res = {};
    const next = jest.fn();
    const mw = middleware(secret);
    mw(req, res, next);
    expect(req.hull.clientCredentials).toEqual(configuration);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("should not fail and call next() if no req.query.config is present", () => {
    const req = {
      query: {}
    };
    const res = {};
    const next = jest.fn();
    const mw = middleware(secret);
    mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
