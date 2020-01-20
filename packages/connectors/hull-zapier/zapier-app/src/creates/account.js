const _ = require("lodash");
const sample = require("../../samples/account.json");
const { createUrl } = require("../config");
const { post } = require("../lib/request");
const { isValidClaim } = require("../lib/utils");
const { getAccountAttributeOutputFields } = require("../lib/output-fields");

const perform = async (z, { inputData }) => {
  const { external_id, domain, attributes } = inputData;

  if (!isValidClaim({ external_id, domain })) {
    throw new z.errors.HaltedError("Invalid Claims");
  }

  const claims = _.pickBy({ domain, external_id }, (v, _k) => !_.isEmpty(v));
  return post(z, {
    url: createUrl,
    body: { entityType: "account", claims, attributes }
  });
};

const account = {
  key: "account",
  noun: "Account",

  display: {
    hidden: false,
    label: "Create or Update an Account",
    description:
      "Sends Attribute updates to the account identified by a domain. Will create the account if not created already."
  },

  operation: {
    outputFields: [getAccountAttributeOutputFields],
    inputFields: [
      {
        required: false,
        list: false,
        label: 'External Id',
        helpText: 'External Id of the Hull Account',
        key: 'external_id',
        type: 'string'
      },
      {
        required: false,
        list: false,
        label: 'Domain',
        helpText: 'Domain of the Hull Account',
        key: 'domain',
        type: 'string'
      },
      {
        default: 'Attributes of the Hull Account',
        required: false,
        label: 'Attributes',
        dict: true,
        key: 'attributes'
      }
    ],
    perform,
    sample
  }
};

module.exports = {
  account
};
