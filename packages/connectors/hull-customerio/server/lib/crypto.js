/* @flow */
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "hull";

const crypto = require("crypto");
const qs = require("querystring");

const algorithm = "aes-128-cbc";

export function encrypt(text: Object, password: string): string {
  const cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(qs.stringify(text), "utf8", "base64");
  crypted += cipher.final("base64");
  return encodeURIComponent(crypted);
}

export function decrypt(text: string, password: string): Object {
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(decodeURIComponent(text), "base64", "utf8");
  dec += decipher.final("utf8");
  return qs.parse(dec);
}

export function middleware(hostSecret: string) {
  return (req: HullRequest, res: HullResponse, next: NextFunction) => {
    if (req.query.conf) {
      req.hull = req.hull || {};
      if (!req.hull.clientCredentials) {
        req.hull.clientCredentials = decrypt(req.query.conf.toString(), hostSecret);
      }
    }
    next();
  };
}
