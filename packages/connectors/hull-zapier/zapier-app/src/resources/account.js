const _ = require("lodash");
const sample = require("../../samples/account.json");
const { schemaUrl, searchUrl, createUrl } = require("../config");
const { post }  = require("../lib/request");
const { subscribe, unsubscribe } = require("../lib");

const entityType = "account";

const schema = async z => post({ z, url: schemaUrl, body: { entityType } });

// This is probably a much cleaner implementation;
// https://zapier.github.io/zapier-platform-schema/build/schema.html#resourceschema
// But we aren't really a REST api so beware of caveats
const account = {
  key: entityType,
  noun: "Account",
  // get: {},
  // list: {},
  hook: {
    display: {
      label: "Account Created",
      description: "Trigger when an Account is Created."
    },
    operation: {
      performSubscribe: subscribe({ entityType, action: "created" }),
      performUnsubscribe: unsubscribe({ entityType, action: "created" }),
      perform: (z, bundle) => [bundle.cleanedRequest]
    }
  },
  search: {
    display: {
      label: "Find an Account",
      directions:
        "Enter a Domain or external_id. We will return all accounts that match",
      important: true,
      description: "Find an account by domain or external_id"
    },
    operation: {
      inputFields: [
        {
          key: "domain",
          type: "string",
          label: "Domain",
          helpText:
            "Domain of the account to lookup. If we find multiple accounts with the same domain, we will return all of them."
        },
        {
          key: "external_id",
          type: "string",
          label: "External ID",
          helpText: "External ID of the Account to lookup"
        }
      ],
      perform: async (z, { inputData }) => {
        const { domain, external_id } = inputData;
        return post({
          z,
          url: searchUrl,
          body: { claims: { domain, external_id }, entityType }
        });
      }
    }
  },
  create: {
    display: {
      // What the user will see in the Zap Editor when selecting an action
      label: "Create or update Account",
      description:
        "Sends Attribute updates to the account identified by a domain. Will create the Account if not created already"
    },
    operation: {
      // Data users will be asked to set in the Zap Editor
      inputFields: [
        { key: "domain", type: "string", label: "Domain", required: false },
        {
          key: "external_id",
          helpText:
            "The external_id of the account to find/create. Takes precedence over the domain if present",
          label: "External ID",
          required: false
        },
        { key: "attributes", label: "Attributes to update", required: false }
      ],
      perform: async (z, { inputData }) => {
        const { external_id, domain, attributes } = inputData;
        return post({
          z,
          url: createUrl,
          body: {
            entityType,
            claims: _.pickBy(
              { domain, external_id },
              (v, _k) => v !== undefined
            ),
            attributes
          }
        });
      }
    }
  },
  sample,
  outputFields: [schema]
};

export default account;
