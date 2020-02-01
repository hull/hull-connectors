/* @flow */
import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { isNull, notNull, isEqual, doesNotContain } = require("hull-connector-framework/src/purplefusion/conditionals");

const { HullOutgoingUser, HullOutgoingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
const { PipedriveOrgWrite, PipedrivePersonWrite, PipedriveAttributeDefinition } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  // {
  //   input: PipedriveAttributeDefinition,
  //   output: HullEnumMap,
  //   strategy: "Jsonata",
  //   direction: "incoming",
  //   batchTransform: true,
  //   transforms: [
  //     `data[field_type='enum' or field_type='set']{ key: options{ label : id }}`
  //   ]
  // },
  {
    input: HullOutgoingAccount,
    output: PipedriveOrgWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "send_raw_array",
    direction: "outgoing",
    transforms: [
      {
        mapping: "connector.private_settings.account_claims",
        inputPath: "account.${hull_field_name}",
        outputPath: "${service_field_name}",
      },
      {
        mapping: "connector.private_settings.outgoing_account_attributes",
        inputPath: "account.${hull_field_name}",
        outputPath: "${service_field_name}",
      }
    ]
  },
  {
    input: HullOutgoingUser,
    output: PipedrivePersonWrite,
    strategy: "MixedTransforms",
    arrayStrategy: "send_raw_array",
    direction: "outgoing",
    transforms: [
      {
        strategy: "PropertyKeyedValue",
        arrayStrategy: "send_raw_array",
        transforms: [
          { inputPath: "user.name",
            outputPath: "name" },
          {
            mapping: "connector.private_settings.user_claims",
            condition: notNull("existingPerson"),
            outputArrayFields: {
              checkField: "service_field_name",
              fields: ["email", "phone"],
              mergeArrayFromContext: "existingPerson.${service_field_name}"
            },
            inputPath: "user.${hull_field_name}",
            outputPath: "${service_field_name}",
          },
          {
            mapping: "connector.private_settings.user_claims",
            condition: isNull("userId"),
            outputArrayFields: {
              checkField: "service_field_name",
              fields: ["email", "phone"]
            },
            inputPath: "user.${hull_field_name}",
            outputPath: "${service_field_name}",
          },
          {
            mapping: "connector.private_settings.outgoing_user_attributes",
            condition: doesNotContain(["hull_service_accountId"], "service_field_name"),
            outputArrayFields: {
              checkField: "service_field_name",
              fields: ["email", "phone"]
            },
            inputPath: "user.${hull_field_name}",
            outputPath: "${service_field_name}"
          },
          {
            condition: "accountId",
            outputPath: "org_id",
            outputFormat: "${accountId}",
          }
        ]
      }
    ]
  }
];

//https://www.hull.io/docs/data_lifecycle/ingest/
const addPostfix = (value) => { return value + "_postfix"; };
const parseNumber = (value) => { return parseInt(value, 10); };
const createString = (value) => { return `${value}`; };
const booleanToString = (value) => { return value ? "true" : "false"; };
//const hullDateToPipedriveDate = (value) =>
const dataTypeConversionMap = {
  "string": {
    //"varchar": convertTest, //Text (up to 255 characters)
    //"varchar_auto": convert, //Autocomplete text (up to 255 characters)
    //"text": convert, //Long text (up to 65k characters)
    "double": parseNumber, // Numeric value
    "monetary": parseNumber, // Monetary field (has a numeric value and a currency value)
    //"date": convert, //Date (format YYYY-MM-DD)
    // "set": addPostfix, //Options field with a possibility of having multiple chosen options
    //"enum": convert, //Options field with a single possible chosen option
    //"phone": convert, //Phone field (up to 255 numbers and/or characters)
    //"time": convert //Time field (format HH:MM:SS)
  },
  "number": {
    "varchar": createString
    //"monetary": convert,
    //"set": convert,
    //"enum": convert
  },
  "date": {
    //"date":
    //"varchar": convert
    //"set": convert,
    //"varchar_auto": convert, //Autocomplete text (up to 255 characters)
    //"text": convert //Long text (up to 65k characters)
  },
  "boolean": {
    "varchar": booleanToString,
    //"set": convert,
    //"varchar_auto": convert, //Autocomplete text (up to 255 characters)
    "text": booleanToString //Long text (up to 65k characters)
  }
};

// {
//   strategy: "AtomicReaction",
//     target: { type: "input" },
//   iterateOn: { type: "settings", path: "outgoing_user_attributes" },
//   operateOn: { type: "input", path: "${value.service}" },
//   mapOn: {
//     key: [
//       { type: "glue", route: "hullUserSchema", truthy: { name: "${value.hull}" }, path: "[0].type" },
//       { type: "glue", route: "pipedrivePersonSchema", truthy: { name: "${value.service}" }, path: "[0].type" }
//     ],
//       map: { type: "static", object: dataTypeConversionMap }
//   },
//   output: { target: { type: "input" }, path: "${value.service}"}
// }

module.exports = transformsToService;
