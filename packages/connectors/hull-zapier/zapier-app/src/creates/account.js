const _ = require("lodash");
const sample = require("../../samples/account.json");
const { createUrl } = require("../config");
const { post } = require("../lib/request");
const { isValidClaims } = require("../lib/utils");
const { getAccountAttributeOutputFields } = require("../lib/output-fields");

const perform = async (z, { inputData }) => {
  const { anonymous_id, external_id, domain, attributes } = inputData;

  if (!isValidClaims({ external_id, domain, anonymous_id })) {
    const errorMessage = {
      "message": !_.every({ external_id, domain, anonymous_id }, v => !!v) ? "Missing Identity Claims": "Invalid Identity Claims",
      external_id,
      domain,
      anonymous_id
    };
    throw new z.errors.HaltedError(JSON.stringify(errorMessage));
  }

  const claims = _.pickBy({ anonymous_id, domain, external_id }, (v, _k) => !!v);
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
        required: false,
        list: false,
        label: 'Anonymous Id',
        helpText: 'Anonymous Id of the Hull Account',
        key: 'anonymous_id',
        type: 'string',
        altersDynamicFields: false
      },
      {
        helpText: 'Attributes of the Hull Account',
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
