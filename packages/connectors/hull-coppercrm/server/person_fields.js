const _ = require("lodash");

module.exports = _.concat(require("./lead_fields"),
  [
    {
      "label": "Company Id",
      "name": "company_id",
      "type": "number",
      "readOnly": false
    }
  ]
);
