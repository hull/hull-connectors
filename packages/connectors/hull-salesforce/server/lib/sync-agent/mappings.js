/* eslint-disable */

const DEFAULT_MAPPING = require("../default-fields.json");
const RELATED_ENTITY_MAPPING = {
  Lead: [
    {
      id: "OwnerId",
      attribute: "Owner.Email",
      related_entity: "User",
      related_attribute: "Email"
    }
  ],
  Contact: [
    {
      id: "OwnerId",
      attribute: "Owner.Email",
      related_entity: "User",
      related_attribute: "Email"
    }
  ],
  Account: [
    {
      id: "OwnerId",
      attribute: "Owner.Email",
      related_entity: "User",
      related_attribute: "Email"
    }
  ]
};

module.exports = {
  DEFAULT_MAPPING,
  RELATED_ENTITY_MAPPING
};
