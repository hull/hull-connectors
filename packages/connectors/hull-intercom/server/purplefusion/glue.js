/* @flow */

import { IntercomIncomingCompany } from "./service-objects";
import { filterL, inc } from "hull-connector-framework/src/purplefusion/language";

const {
  route,
  set,
  get,
  ifL,
  Svc,
  moment,
  settings,
  ex,
  cast,
  cond,
  ld,
  not,
  iterateL,
  transformTo,
  input,
  filter,
  utils,
  loopEndL,
  loopL,
  or,
  hull
} = require("hull-connector-framework/src/purplefusion/language");

const {
  CompanyRead
} = require("./service-objects");

function intercom(op: string, param?: any): Svc {
  return new Svc({ name: "intercom", op }, param);
}

const glue = {
  ensureHook: [
    set("intercomApiVersion", "2.1"),
    set("service_name", "intercom")

  ],
  refreshToken: [],
  isConfigured: cond("allTrue", [
    cond("notEmpty", settings("access_token"))
  ]),
  getFetchWindow: [
    set("fetchStart", ex(ex(moment(), "subtract", { minutes: 6 }), "valueOf")),
    set("fetchEnd", ex(moment(), "valueOf")),
  ],
  getFetchFields: [],
  fetchRecentCompany: ifL(
    cond("allTrue", [
      route("isConfigured"),
      settings("fetch_companies")
    ]), [
      set("pageOffset", 1),
      set("pageSize", 60),
      loopL([
        set("page", intercom("getRecentCompanies")),
        set("intercomCompanies", filterL(cond("greaterThan", "${company.updated_at}", settings("companies_last_fetch_timestamp")), "company", "${page.data}")),
        iterateL("${intercomCompanies}", { key: "intercomCompany", async: true},
          hull("asAccount", cast(IntercomIncomingCompany, "${intercomCompany}"))
        ),
        ifL(or([
          cond("isEqual", "${page.pages.next}", null),
          cond("lessThan", get("updated_at", ld("last", "${page.data}")), settings("companies_last_fetch_timestamp"))
        ]), loopEndL()),
        set("pageOffset", inc("${pageOffset}"))
      ])
  ]),
  fetchAllCompany: ifL(
    cond("allTrue", [
      route("isConfigured")]
    ), [

    loopL([
      set("page", intercom("getAllCompaniesScroll")),
      ifL(or([
        cond("isEmpty", "${page}"),
        cond("isEmpty", "${page.data}")
      ]), loopEndL()),
      iterateL("${page.data}", { key: "intercomCompany", async: true},
        hull("asAccount", cast(IntercomIncomingCompany, "${intercomCompany}"))
      ),
      set("offset", "${page.scroll_param}"),
      set("page", []),
    ])
  ])
};

module.exports = glue;
























