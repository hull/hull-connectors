import dns from "dns";
import { Address6 } from "ip-address";
import urijs from "urijs";
import _ from "lodash";

const isForbidden = ip => {
  if (!ip) {
    return true;
  }
  const addr = Address6.fromAddress4(ip);
  const subnet = new Address6.fromAddress4("172.31.0.0/16");
  return (
    addr.isMulticast() ||
    addr.isInSubnet(subnet) ||
    addr.isLoopback() ||
    addr.isLinkLocal()
  );
};

export default async function ipCheck(url) {
  const hostname = new urijs(url).hostname();
  return new Promise((resolve, reject) =>
    dns.resolve4(hostname, (err, addresses) => {
      console.log("Resolved ", { hostname, addresses });
      if (err) {
        return reject(err);
      }
      if (_.some(addresses, isForbidden)) {
        return reject(new Error("Forbidden Address"));
      }
      return resolve();
    })
  );
}
