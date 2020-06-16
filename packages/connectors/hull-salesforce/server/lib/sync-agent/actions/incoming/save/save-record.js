/* @flow */

const _ = require("lodash");
const Promise = require("bluebird");
const { saveAccountObject } = require("./save-account");
const { saveContactObject } = require("./save-contact");
const { saveLeadObject } = require("./save-lead");
const { saveCustomObject } = require("./save-custom-object");

function saveRecord({ privateSettings, syncAgent, record, resourceSchema }: Object): Promise<*> {
  const type: string = _.has(record, "attributes.type") ? record.attributes.type : "unknown";

  switch (type) {
    case "Account": {
      return saveAccountObject({ privateSettings, syncAgent, record, resourceSchema });
    }

    case "Contact": {
      return saveContactObject({ privateSettings, syncAgent, record, resourceSchema });
    }

    case "Lead": {
      return saveLeadObject({ privateSettings, syncAgent, record, resourceSchema });
    }

    case "Task": {
      return saveCustomObject({ privateSettings, syncAgent, record, resourceSchema });
    }

    default:
      return Promise.resolve();
  }
}

module.exports = {
  saveRecord
};
