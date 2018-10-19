const {
  fieldsOutreachProspectInbound,
  fieldsOutreachProspectOutbound,
  fieldsOutreachAccountOutbound,
  fieldsOutreachAccountInbound,
  fieldsHullAccountIdent,
  fieldsOutreachAccountIdent
} = require("./settings-fields");
const userUpdate = require("./user-update");
const accountUpdate = require("./account-update");

const fetchAction = require("./fetch");
const adminHandler = require("./admin-handler");
const statusCheck = require("./status-check");
const tokenCheck = require("./token-check");

const oauth = require("./oauth");

module.exports = {
  fieldsOutreachProspectInbound,
  fieldsOutreachProspectOutbound,
  fieldsOutreachAccountOutbound,
  fieldsOutreachAccountInbound,
  fieldsHullAccountIdent,
  fieldsOutreachAccountIdent,
  fetchAction,
  userUpdate,
  accountUpdate,
  adminHandler,
  oauth,
  statusCheck,
  tokenCheck
};
