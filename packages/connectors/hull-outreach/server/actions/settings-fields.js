/* @flow */

import type { OutreachFieldDefinition } from "../lib/types";

const _ = require("lodash");

const ACCOUNT_FIELDDEFS = require("./fielddefs/account-fielddefs");
const PROSPECT_FIELDDEFS = require("./fielddefs/prospect-fielddefs");

function getFieldsOutreach(
  fields: Array<OutreachFieldDefinition>,
  filter: Object
): Array<Object> {
  const filteredFields = _.filter(fields, filter);
  const opts = _.map(filteredFields, f => {
    return { value: f.id, label: f.label };
  });

  return opts;
}

function fieldsOutreachProspectInbound() {
  return Promise.resolve({
    options: getFieldsOutreach(PROSPECT_FIELDDEFS, { in: true })
  });
}

function fieldsOutreachProspectOutbound() {
  return Promise.resolve({
    options: getFieldsOutreach(PROSPECT_FIELDDEFS, { out: true })
  });
}

function fieldsOutreachAccountInbound() {
  return Promise.resolve({
    options: getFieldsOutreach(ACCOUNT_FIELDDEFS, { in: true })
  });
}

function fieldsOutreachAccountOutbound() {
  return Promise.resolve({
    options: getFieldsOutreach(ACCOUNT_FIELDDEFS, { out: true })
  });
}

module.exports = {
  fieldsOutreachProspectInbound,
  fieldsOutreachProspectOutbound,
  fieldsOutreachAccountInbound,
  fieldsOutreachAccountOutbound
};
