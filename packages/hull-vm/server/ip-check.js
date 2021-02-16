import dns from "dns";
import { Address4 } from "ip-address";
import urijs from "urijs";
import _ from "lodash";

const isForbidden = ip => {
  const addr = new Address4(ip);
  const subnet = new Address4("172.31.0.0/16");
  if (
    addr.isMulticast() ||
    addr.isInSubnet(subnet) ||
    addr.isLoopback() ||
    addr.isAnyLocal() ||
    addr.isLinkLocal() ||
    addr.isSiteLocal()
  ) {
    return true;
  }
  return false;
};

export default async function ipCheck(url) {
  const hostname = new urijs(url).hostname();
  return Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err) {
        return reject(err);
      }
      if (_.some(addresses.map(isForbidden), true)) {
        return reject(new Error("Forbidden Address"));
      }
      return resolve();
    });
  });
}
