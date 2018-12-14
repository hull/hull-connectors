/* @flow */
import type { THashAlgorithm } from "../types";

const hash = require("object-hash");

class HashUtil {
  /**
   * Creates a hex hash of the data with the specified algorithm.
   *
   * @param {*} data The data to hash.
   * @param {THashAlgorithm} [algorithm="sha1"] The algorithm to use, defaults to sha1.
   * @returns {string} The hash of the data.
   * @memberof HashUtil
   */
  hash(data: Object, algorithm: THashAlgorithm = "sha1"): string {
    const opts = {
      algorithm,
      encoding: "hex",
      respectType: false
    };
    return hash(data, opts);
  }
}

module.exports = HashUtil;
