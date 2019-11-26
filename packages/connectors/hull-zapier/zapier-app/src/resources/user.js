const _ = require("lodash");
const sample = require("../../samples/account.json");
const { schemaUrl, searchUrl, createUrl } = require("../config");
const { post }  = require("../lib/request");
const { subscribe, unsubscribe } = require("../lib");


const entityType = "user";

const schema = async z => post({ z, url: schemaUrl, body: { entityType } });

// This is probably a much cleaner implementation;
// https://zapier.github.io/zapier-platform-schema/build/schema.html#resourceschema
// But we aren't really a REST api so beware of caveats
const user = {
  key: entityType,
  noun: "User",
  // get: {},
  // list: {},
  hook: {
    display: {
      label: "User Created",
      description: "Trigger when a User is Created."
    },
    operation: {
      performSubscribe: subscribe({ entityType, action: "created" }),
      performUnsubscribe: unsubscribe({ entityType, action: "created" }),
      perform: (z, bundle) => [bundle.cleanedRequest]
    }
  },
  search: {
    display: {
      label: "Find a User",
      directions:
        "Enter an Email or external_id. We will return all users that match",
      important: true,
      description: "Find a user by email or external_id"
    },
    operation: {
      inputFields: [
        {
          key: "email",
          type: "string",
          label: "Email",
          helpText:
            "Email of the User to lookup. If we find multiple users with the same email, we will return all of them."
        },
        {
          key: "external_id",
          type: "string",
          label: "External ID",
          helpText: "External ID of the User to lookup"
        }
      ],
      perform: async (z, { inputData }) => {
        const { email, external_id } = inputData;
        return post(z, {
          url: searchUrl,
          body: { claims: { email, external_id }, entityType }
        });
      }
    }
  },
  create: {
    display: {
      // What the user will see in the Zap Editor when selecting an action
      label: "Create or update User",
      description:
        "Sends Attribute updates to the user identified by an email. Will create the User if not created already"
    },
    operation: {
      // Data users will be asked to set in the Zap Editor
      inputFields: [
        { key: "email", type: "string", label: "Email", required: false },
        {
          key: "external_id",
          helpText:
            "The external_id of the user to find/create. Takes precedence over the email if present",
          label: "External ID",
          required: false
        },
        { key: "attributes", label: "Attributes to update", required: false }
      ],
      perform: async (z, { inputData }) => {
        const { external_id, email, attributes } = inputData;
        return post(z, {
          url: createUrl,
          body: {
            entityType,
            claims: _.pickBy(
              { email, external_id },
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

export default user;
