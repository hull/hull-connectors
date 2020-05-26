const _ = require("lodash");
const sample = require("../../samples/user");
const { createUrl } = require("../config");
const { post } = require("../lib/request");
const { isValidClaim } = require("../lib/utils");
const { getUserAttributeOutputFields } = require("../lib/output-fields");

const perform = async (z, { inputData }) => {
  const { external_id, email, attributes } = inputData;

  if (!isValidClaim({ external_id, email })) {
    const errorMessage = {
      "message": _.isNil(external_id) && _.isNil(email) ? "Missing Identity Claims": "Invalid Identity Claims",
      external_id,
      email
    };
    throw new z.errors.HaltedError(JSON.stringify(errorMessage));
  }

  const claims = _.pickBy({ email, external_id }, (v, _k) => !_.isEmpty(v));
  return post(z, {
    url: createUrl,
    body: { entityType: "user", claims, attributes }
  });
};

const user = {
  key: "user",
  noun: "User",

  display: {
    hidden: false,
    label: "Create or Update a User",
    description:
      "Sends Attribute updates to the user identified by an email. Will create the user if not created already."
  },

  operation: {
    outputFields: [getUserAttributeOutputFields],
    inputFields: [
      {
        required: false,
        list: false,
        label: 'External Id',
        helpText: 'External Id of the Hull User',
        key: 'external_id',
        type: 'string',
        altersDynamicFields: false
      },
      {
        required: false,
        list: false,
        label: 'Email',
        helpText: 'Email of the Hull User',
        key: 'email',
        type: 'string',
        altersDynamicFields: false
      },
      {
        default: 'Attributes of the Hull User',
        required: false,
        label: 'Attributes',
        dict: true,
        key: 'attributes',
        altersDynamicFields: false
      }
    ],
    perform,
    sample
  }
};

module.exports = {
  user
};
