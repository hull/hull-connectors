const _ = require("lodash");
const sample = require("../../samples/user.json");
const { schemaUrl, searchUrl } = require("../config");
const { post } = require("../lib/request");
const { isValidClaims } = require("../lib/utils");
const { getUserAttributeOutputFields } = require("../lib/output-fields");

const perform = async (z, { inputData }) => {
  const { anonymous_id, email, external_id } = inputData;
  const claims = { anonymous_id, email, external_id };

  if (!isValidClaims({ external_id, email, anonymous_id })) {
    const errorMessage = {
      "message": !_.every({ external_id, email, anonymous_id }, v => !!v)? "Missing Identity Claims": "Invalid Identity Claims",
      external_id,
      email,
      anonymous_id
    };
    throw new z.errors.HaltedError(JSON.stringify(errorMessage));
  }

  const res = await post(z,{
    url: searchUrl,
    body: { claims, entityType: "user" }
  });

  if (_.get(res, "error", false)) {
    throw new z.errors.HaltedError([{ error: `User with claims ${JSON.stringify(claims)} not found.`}]);
  }

  return res;
};

const schema = async z =>
  post(z, { url: schemaUrl, body: { entityType: "account" } });

const user = {
  key: "user",
  noun: "User",
  display: {
    label: "Find a User",
    description: "Search for a User by email or external_id"
  },
  operation: {
    inputFields: [
      {
        key: "external_id",
        type: "string",
        label: "External ID",
        helpText: "External ID of the user to look up"
      },
      {
        key: "email",
        type: "string",
        label: "Email",
        helpText:
          "Email of the User to lookup. If we find multiple emails, we will use the oldest entry"
      },
      {
        label: 'Anonymous Id',
        helpText: 'Anonymous Id of the Hull User',
        key: 'anonymous_id',
        type: 'string'
      }
    ],
    perform,
    sample,
    outputFields: [getUserAttributeOutputFields]
  }
};

module.exports = {
  user
};
