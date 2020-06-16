
const Factory = require("rosie").Factory;
const _ = require("lodash");

module.exports = new Factory()
  .attr("Website", ["Website"], (Website) => {
    return Website;
  })
  .attr("Id", ["Id"], (Id) => {
    return Id;
  })
  .attr("CustomIdentifierField__c", ["CustomIdentifierField__c"], (CustomIdentifierField__c) => {
    return CustomIdentifierField__c;
  });
