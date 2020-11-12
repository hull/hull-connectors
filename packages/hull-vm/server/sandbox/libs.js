// @flow

import type { HullContext } from "hull";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";

import getRequest from "./request";
import getSuperagent from "./superagent";
import getUUID from "./uuid";
import getLibPhoneNumber from "./libphonenumber";

export default function getLibs(ctx: HullContext) {
  return {
    _,
    moment,
    urijs,
    setIfNull: (value: string) => ({ operation: "setIfNull", value }),
    increment: (value: string) => ({ operation: "increment", value }),
    decrement: (value: string) => ({ operation: "increment", value }),
    request: getRequest(ctx),
    superagent: getSuperagent(ctx),
    LibPhoneNumber: getLibPhoneNumber(),
    uuid: getUUID()
  };
}
