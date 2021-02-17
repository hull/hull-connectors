// @flow

import dns from "dns";
import urijs from "urijs";
import _ from "lodash";
import { isIP, inRange } from "range_check";

import type { HullContext } from "../types";

const FORBIDDEN_RANGES = [
  "172.31.0.0/16",
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "224.0.0.0/4",
  "240.0.0.0/4",
  "255.255.255.255/32",
  // V6
  "::/128",
  "::1/128",
  "::ffff:0:0/96",
  "::/96",
  "100::/64",
  "2001:10::/28",
  "2001:db8::/32",
  "fc00::/7",
  "fe80::/10",
  "fec0::/10",
  "ff00::/8"
];
const isForbidden = ip => {
  if (!isIP(ip)) {
    return true;
  }
  return inRange(ip, FORBIDDEN_RANGES);
};

const getUrl = url => {
  const protocolRegex = new RegExp("^(?:[a-z]+:)?//", "i");
  if (!protocolRegex.test(url)) {
    return `http://${url}`;
  }
  return url;
};

module.exports = (ctx: HullContext) =>
  async function ipCheck(url) {
    const { client } = ctx;
    const hostname = new urijs(getUrl(url)).hostname();
    return new Promise((resolve, reject) =>
      dns.resolve4(hostname, (err, addresses) => {
        if (err) {
          client.logger.error("outgoing.error", {
            url,
            hostname,
            addresses,
            reason: err.message
          });
          err.message = `DNS Resolution Error: ${err.message}`;
          err.data = { addresses, hostname };
          console.log("Error resolving host", { hostname, addresses });
          return reject(err);
        }
        if (_.some(addresses, isForbidden)) {
          client.logger.error("outgoing.error", {
            url,
            reason: "Forbidden Address",
            hostname,
            addresses
          });
          const error = new Error("Forbidden Address");
          error.message = `DNS Resolution Error: ${error.message}`;
          error.data = { addresses, hostname };
          console.log("Forbidden Address", { hostname, addresses });
          return reject(error);
        }
        console.log("Resolved ", { hostname, addresses });
        return resolve();
      })
    );
  };
