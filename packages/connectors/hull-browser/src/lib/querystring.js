/* global window */

import queryString from "query-string";
import { Promise } from "es6-promise";

export default function getQueryStringIds() {
  return new Promise(function getId(resolve /* , reject */) {
    const { location } = window;
    // https://segment.com/docs/sources/website/analytics.js/#querystring-api
    const { ajs_email: email, ajs_uid: external_id, ajs_aid: anonymous_id } = (queryString.parse(location.search) || {});
    if (!external_id && !anonymous_id && !email) return resolve({});
    return resolve({ anonymous_id, external_id, email });
  });
}
