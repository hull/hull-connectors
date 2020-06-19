// @flow

import crypto from "crypto";

const getHash = (data: {}) => {
  return crypto
    .createHash("sha384")
    .update(JSON.stringify(data), "utf-8")
    .digest("hex");
};
export default getHash;
