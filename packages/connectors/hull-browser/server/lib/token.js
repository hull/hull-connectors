// @flow

import crypto from "crypto";
import jwt from "jwt-simple";
import type { NextFunction } from "express";
import type { HullContext, HullRequest, HullResponse } from "hull";

const algorithm = "aes-256-ctr";

export default function buildTokenFactory({
  hostSecret
}: {
  hostSecret: string
}) {
  function encrypt(text: string) {
    const cipher = crypto.createCipher(algorithm, hostSecret);
    const crypted = cipher.update(jwt.encode(text, hostSecret), "utf8", "hex");
    return crypted + cipher.final("hex");
  }

  function decrypt(
    text: string
  ): $PropertyType<HullContext, "clientCredentials"> {
    const decipher = crypto.createDecipher(algorithm, hostSecret);
    const dec = decipher.update(text, "hex", "utf8");
    return jwt.decode(dec + decipher.final("utf8"), hostSecret);
  }

  const parse = function parse(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ) {
    req.hull = req.hull || {};
    const token: string = req.query.token.toString();
    if (!token) return res.sendStatus(400);
    // TODO: check that Decrypt returns a proper ClientCredentials object
    req.hull.clientCredentials = decrypt(token);
    return next();
  };

  return { encrypt, decrypt, parse };
}
