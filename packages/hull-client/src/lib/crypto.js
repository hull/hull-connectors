const _ = require("lodash");
const crypto = require("crypto");
const jwt = require("jwt-simple");

function getSecret(config = {}, secret) {
  return secret || config.accessToken || config.secret;
}
function sign(config, data) {
  if (!_.isString(data)) {
    throw new Error("Signatures can only be generated for Strings");
  }
  const sha1 = getSecret(config);
  return crypto.createHmac("sha1", sha1).update(data).digest("hex");
}
function checkConfig(config) {
  if (!config || !_.isObject(config) || !config.id || !config.secret) {
    throw new Error(`invalid config in Crypto: ${JSON.stringify(config)}`);
  }
}

function buildToken(config, claims = {}) {
  if (claims.nbf) {
    claims.nbf = Number(claims.nbf);
  }
  if (claims.exp) {
    claims.exp = Number(claims.exp);
  }
  const iat = Math.floor(new Date().getTime() / 1000);
  const claim = {
    iss: config.id,
    iat,
    ...claims
  };
  return jwt.encode(claim, getSecret(config));
}

/** @namespace */
module.exports = {
  sign(config, data) {
    checkConfig(config);
    return sign(config, data);
  },

  /**
   * Calculates the hash for a user lookup - io.hull.as
   *
   * This is a wrapper over `buildToken` method.
   * If the identClaim is a string or has id property, it's considered as an object id,
   * and its value is set as a token subject.
   * Otherwise it verifies if required ident properties are set
   * and saves them as a custom ident claim.
   *
   * @param {Object} config object
   * @param {string} subjectType - "user" or "account"
   * @param {string|Object} objectClaims user or account main identity claim - object or string
   * @param {Object} additionalClaims
   * @returns {string} The jwt token to identity the user.
   */
  lookupToken(config, subjectType, objectClaims = {}, additionalClaims = {}) {
    subjectType = _.toLower(subjectType);
    if (!_.includes(["user", "account"], subjectType)) {
      throw new Error("Lookup token supports only `user` and `account` types");
    }

    checkConfig(config);
    const claims = {};

    const subjectClaim = objectClaims[subjectType];

    if (_.isString(subjectClaim)) {
      claims.sub = subjectClaim;
    } else if (subjectClaim.id) {
      claims.sub = subjectClaim.id;
    }

    _.reduce(
      objectClaims,
      (c, oClaims, objectType) => {
        if (_.isObject(oClaims) && !_.isEmpty(oClaims)) {
          c[`io.hull.as${_.upperFirst(objectType)}`] = oClaims;
        } else if (
          _.isString(oClaims) &&
          !_.isEmpty(oClaims) &&
          objectType !== subjectType
        ) {
          c[`io.hull.as${_.upperFirst(objectType)}`] = { id: oClaims };
        }
        return c;
      },
      claims
    );

    if (_.has(additionalClaims, "scopes")) {
      claims.scopes = additionalClaims.scopes;
    }

    if (_.has(additionalClaims, "create")) {
      claims["io.hull.create"] = additionalClaims.create;
    }

    if (_.has(additionalClaims, "active")) {
      claims["io.hull.active"] = additionalClaims.active;
    }

    claims["io.hull.subjectType"] = subjectType;
    return buildToken(config, claims);
  },

  /**
   * Checks the signed userId - used in middleware to authenticate the current user locally via signed cookies.
   *
   * @param {string} userId  the userId to check
   * @param {string} userSig the signed userId
   * @returns {string|boolean} the userId if the signature matched, false otherwise.
   */
  currentUserId(config, userId, userSig) {
    checkConfig(config);
    if (!userId || !userSig) {
      return false;
    }
    const [time, signature] = userSig.split(".");
    const data = [time, userId].join("-");
    return sign(config, data) === signature;
  }
};
