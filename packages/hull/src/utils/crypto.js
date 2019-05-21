// @flow

import qs from "querystring";
import crypto from "crypto";

const algorithm = "aes-128-cbc";

export function encrypt(config: Object, password: string): string {
  const cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(qs.stringify(config), "utf8", "base64");
  crypted += cipher.final("base64");
  return encodeURIComponent(crypted);
}

export function decrypt(config: string, password: string): Object {
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(decodeURIComponent(config), "base64", "utf8");
  dec += decipher.final("utf8");
  return qs.parse(dec);
}
