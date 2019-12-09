const _ = require("lodash");

module.exports = _.concat(require("./lead_fields"),
  [
    {
      "display": "Company Id",
      "name": "company_id",
      "type": "number",
      "readOnly": false
    },
    {
      "display": "Contact Type",
      "name": "contactType",
      "type": "string",
      "readOnly": false
    }
  ]
);
