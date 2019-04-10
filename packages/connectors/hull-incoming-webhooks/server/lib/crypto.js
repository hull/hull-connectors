import crypto from "crypto";
import qs from "querystring";
import url from "url";
import _ from "lodash";

const debug = require("debug")("hull-incoming-webhooks:cryptoMiddleware");

const algorithm = "aes-128-cbc";

// @TODO use this encryption instead of JWT when providing Tokens to external tools ?

export function encrypt(text, password) {
  const cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(qs.stringify(text), "utf8", "base64");
  crypted += cipher.final("base64");
  return encodeURIComponent(crypted);
}

export function decrypt(text, password) {
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(decodeURIComponent(text), "base64", "utf8");
  dec += decipher.final("utf8");
  return qs.parse(dec);
}

export function middleware(password) {
  return (req, res, next) => {
    const pathName = _.get(
      url.parse(req.url).pathname.match("/webhooks/(?:[a-zA-Z0-9]*)/(.*)"),
      "[1]"
    );
    debug("url", { pathName, url: req.url, query: req.query });
    const { conf } = req.query || {};
    const clientCredentials = decrypt(pathName || conf, password);
    debug("clientCredentials", clientCredentials);
    if (pathName) {
      req.hull = req.hull || {};
      req.hull.clientCredentials = clientCredentials;
    }
    return next();
  };
}
