import crypto from "crypto";
import qs from "querystring";
import url from "url";
import _ from "lodash";

const algorithm = "aes-128-cbc";

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
    if (pathName) {
      req.hull = req.hull || {};
      req.hull.config = decrypt(pathName, password);
      return next();
    }

    if (req.query && req.query.conf) {
      req.hull = req.hull || {};
      req.hull.config = decrypt(req.query.conf, password);
      return next();
    }
    return next();
  };
}
