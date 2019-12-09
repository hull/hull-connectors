/* global window */

import { Promise } from "es6-promise";

export default function getHullIds() {
  return new Promise(function getId(resolve /* , reject */) {
    const { Hull } = window;
    if (!Hull) return resolve({});
    return Hull.ready().then(({ hull }) => {
      const { anonymousId } = hull.config();
      return resolve({ anonymous_id: anonymousId });
    });
  });
}
