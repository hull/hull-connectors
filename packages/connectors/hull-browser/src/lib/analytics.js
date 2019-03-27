/* global window */

import isEmpty from "lodash/isEmpty";
import { Promise } from "es6-promise";
import intercom from "./intercom";

export default function getAnalyticsId() {
  return new Promise(function getId(resolve /* , reject */) {
    const { analytics } = window;
    if (!analytics || !analytics.user) return resolve({});
    setTimeout(() => resolve({}), 500);

    return analytics.ready(function analyticsReady() {
      const user = analytics.user();
      const externalId = user.id();
      const anonymousId = user.anonymousId();
      const email = user.traits().email;
      intercom().then((ids = {}) => {
        // Handle the async Intercom load by Segment;
        if (!isEmpty(ids)) return resolve(ids);
        return resolve({ anonymous_id: anonymousId, external_id: externalId, email });
      });
    });
  });
}
