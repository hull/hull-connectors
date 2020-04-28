const _ = require("lodash");
const sample = require("../../samples/user");
const { createUrl } = require("../config");
const { post } = require("../lib/request");

const perform = async (z, { inputData }) => {
  const { anonymous_id, external_id, email, event_name, properties } = inputData;
  const claims = _.pickBy({ anonymous_id, email, external_id }, (v, _k) => !_.isEmpty(v));
  return post(z,{
    url: createUrl,
    body: { entityType: "user_event", claims, event_name, properties }
  });
};

const user_event = {
  key: "user_event",
  noun: "User Event",

  display: {
    hidden: false,
    label: "Create User Event",
    description:
      "Adds an Event to the user identified by an email. Will create the User if not created already"
  },

  operation: {
    // Data users will be asked to set in the Zap Editor
    inputFields: [
      {
        key: "email",
        list: false,
        label: "Email",
        helpText:
          "The email to associate the event to. If multiple emails are found in Hull, event will be associated to the oldest entry",
        required: false
      },
      {
        key: "external_id",
        list: false,
        helpText:
          "The external_id of the user to associate the event to. Takes precedence over the email if present",
        label: "External ID",
        required: false
      },
      {
        required: false,
        list: false,
        label: 'Anonymous Id',
        helpText: 'Anonymous Id of the Hull User',
        key: 'anonymous_id',
        type: 'string',
        altersDynamicFields: false
      },
      {
        key: "event_name",
        label: "Event Name",
        list: false,
        helpText:
          "The Name of the event, such as 'Email Opened', 'Subscription Added', etc.",
        required: false
      },
      {
        key: "properties",
        label: "Event Properties",
        helpText: "A list of properties to store on the created event",
        dict: true,
        required: false
      }
    ],
    perform,

    sample
  }
};

module.exports = {
  user_event
};
