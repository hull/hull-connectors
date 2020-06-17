
const Factory = require("rosie").Factory;
const _ = require("lodash");

module.exports = new Factory()
  .attr("domain", ["domain"], (domain) => {
    return domain;
  })
  .attr("id", ["id"], (id) => {
    return id;
  })
  .attr("external_id", ["external_id"], (external_id) => {
    return external_id;
  });
