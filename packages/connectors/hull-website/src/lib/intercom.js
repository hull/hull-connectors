import { Promise } from "es6-promise";

export default function getIntercomId() {
  return new Promise(function getId(resolve /* , reject */) {
    const { Intercom } = window;
    if (!Intercom) return resolve({});
    const vId = Intercom("getVisitorId");
    if (!vId) return resolve({});
    return resolve({ anonymous_id: `intercom:${vId}` });
  });
}
