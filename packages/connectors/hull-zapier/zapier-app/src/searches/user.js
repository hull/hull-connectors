const _ = require("lodash");
const sample = require("../../samples/user.json");
const { schemaUrl, searchUrl } = require("../config");
const { post } = require("../lib/request");
const { isValidClaim } = require("../lib/utils");
const { getUserAttributeOutputFields } = require("../lib/output-fields");

const perform = async (z, { inputData }) => {
  const { email, external_id } = inputData;
  const claims = { email, external_id };

  if (!isValidClaim({ external_id, email })) {
    const errorMessage = {
      "message": _.isNil(external_id) && _.isNil(email) ? "Missing Identity Claims": "Invalid Identity Claims",
      external_id,
      email
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
