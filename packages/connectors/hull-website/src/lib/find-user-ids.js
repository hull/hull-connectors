import isEmpty from "lodash/isEmpty";
import find from "lodash/find";
import { getLocalStorageId } from "./localstorage";
import getAnalyticsIds from "./analytics";
import getHullIds from "./hull";
import getIntercomIds from "./intercom";
import getQueryStringIds from "./querystring";

const debug = require("debug")("hull-browser");

const findId = (ids = []) => find(ids, idGroup => !isEmpty(idGroup));

const findUserIds = async ({ socket, callback }) => {
  try {
    const ids = await Promise.all([
      getLocalStorageId(),
      getQueryStringIds(),
      getIntercomIds(),
      getHullIds(),
      getAnalyticsIds()
    ]);
    const claims = findId(ids);
    if (!isEmpty(claims)) {
      callback(null, claims);
      return;
    }
    setTimeout(() => findUserIds({ socket, callback }), 500);
  } catch (err) {
    debug(err);
  }
};

export default findUserIds;
