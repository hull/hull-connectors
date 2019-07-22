// @flow;

import webhooks from "./webhooks";
import accountFetchAll from "./account-fetch-all";
import prospectFetchAll from "./prospect-fetch-all";
import fetchAll from "./fetch-all";

const {
  fieldsOutreachProspectInbound,
  fieldsOutreachProspectOutbound,
  fieldsOutreachAccountOutbound,
  fieldsOutreachAccountInbound,
  fieldsHullAccountIdent,
  fieldsOutreachAccountIdent
} = require("./settings-fields");
const adminHandler = require("./admin-handler");

module.exports = {
  fieldsOutreachProspectInbound,
  fieldsOutreachProspectOutbound,
  fieldsOutreachAccountOutbound,
  fieldsOutreachAccountInbound,
  fieldsHullAccountIdent,
  fieldsOutreachAccountIdent,
  adminHandler,
  webhooks,
  accountFetchAll,
  prospectFetchAll,
  fetchAll
};
