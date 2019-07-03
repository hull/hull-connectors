/* global window */

import { Promise } from "es6-promise";

export default function getHullIds() {
  return new Promise(function getId(resolve /* , reject */) {
    const { Hull } = window;
    if (!Hull) return resolve({});
    return Hull.ready().then(({ hull, me = {} }) => {
      const { anonymousId } = hull.config();
      if (!me) return resolve({ anonymous_id: anonymousId });

      const { external_id, id, email } = me;
      return resolve({ id, external_id, anonymous_id: anonymousId, email });
    });
  });
}
