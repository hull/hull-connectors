// @flow

import crypto from "crypto";

function getSortedHash(inputHash) {
  const resultHash = {};
  Object.keys(inputHash)
    .sort((a, b) => inputHash[a] - inputHash[b])
    .reverse()
    .forEach(k => {
      resultHash[k] = inputHash[k];
    });
  return resultHash;
}

const getHash = (data: {}) =>
  crypto
    .createHash("sha384")
    .update(JSON.stringify(getSortedHash(data)), "utf-8")
    .digest("hex");

export default getHash;
