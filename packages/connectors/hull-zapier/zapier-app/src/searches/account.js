const _ = require("lodash");
const sample = require("../../samples/account.json");
const { schemaUrl, searchUrl } = require("../config");
const { post } = require("../lib/request");
const { isValidClaim } = require("../lib/utils");
const { getAccountAttributeOutputFields } = require("../lib/output-fields");

const perform = async (z, { inputData }) => {
  const { domain, external_id } = inputData;
  const claims = { domain, external_id };

  if (!isValidClaim({ external_id, domain })) {
    throw new z.errors.HaltedError("Invalid Claims");
  }

  const res = await post(z,{
    url: searchUrl,
    body: { claims, entityType: "account" }
  });

  if (_.get(res, "error", false)) {
    throw new z.errors.HaltedError([{ error: `Account with claims ${JSON.stringify(claims)} not found.`}]);
  }

  return res;
};

const schema = async z =>
  post(z, {url: schemaUrl, body: { entityType: "account" } });

const account = {
  key: "account",
  noun: "Account",
  display: {
    label: "Find an Account",
    description: "Search for an Account by domain or external_id"
  },
  operation: {
    inputFields: [
      {
        key: "external_id",
        type: "string",
        label: "External ID",
        helpText: "External ID of the Account to lookup"
      },
      {
        key: "domain",
        type: "string",
        label: "Domain",
        helpText:
          "Domain of the account to lookup. If we find multiple accounts with the same domain, we will use the oldest one."
      }
    ],
    perform,
    sample,
    outputFields: [getAccountAttributeOutputFields]
  }
};

module.exports = {
  account
};
