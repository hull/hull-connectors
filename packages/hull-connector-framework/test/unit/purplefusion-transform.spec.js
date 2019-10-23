/* @flow */
const _ = require("lodash");

const { performTransformation } = require("../../src/purplefusion/transform-utils");
const { setHullDataType } = require("../../src/purplefusion/utils");
const HullVariableContext = require("../../src/purplefusion/variable-context");
const { TransformImpl } = require("../../src/purplefusion/transform-impl");


describe("Transformation tests", () => {

  it("type conversion", () => {

    const dispatcher = {
      resolve: (context, route, input) => {
        if (route.options.name === "inputSchemaRoute") {
          return {
            "otherservice/name": {
              type: "string"
            },
            "otherservice/age": {
              type: "string"
            },
            "otherservice/job_title": {
              type: "string"
            },
            "otherservice/somecode": {
              type: "int"
            }
          }
        } else if (route.options.name === "outputSchemaRoute") {
          return {
            "howold": {
              type: "int"
            },
            "title": {
              type: "array"
            },
            "code": {
              type: "string"
            }
          }
        }
      }
    };

    const context = new HullVariableContext({
      connector: {
        private_settings: {
          outgoing_user_attributes: [
            { hull: "otherservice/name", service: "name" },
            { hull: "otherservice/age", service: "howold" },
            { hull: "otherservice/job_title", service: "title" },
            { hull: "otherservice/somecode", service: "code" }
          ]
        }
      }
    });
    const initialInput = {
      name: "Tim Liu",
      howold: "34",
      title: "coder,product,support",
      code: 1234
    };

    const transformation = {
      target: { type: "input" },
      iterateOn: { type: "settings", path: "outgoing_user_attributes" },
      operateOn: { type: "input", path: "${value.service}" },
      mapOn: {
        key: [
          { type: "glue", route: "inputSchemaRoute", path: "${value.hull}.type" },
          { type: "glue", route: "outputSchemaRoute", path: "${value.service}.type" }
        ],
        map: {
          type: "static",
          object:
            {
              "string": {
                "int": (value) => { return parseInt(value, 10); },
                "array": (value) => { return value.split(","); }
              },
              "int": {
                "string": (value) => { return `${value}`; }
              }
            }
        }
      },
      output: { path: "${value.service}" }
    };

    return performTransformation(dispatcher, context, initialInput, transformation)
      .then((results) => {
        expect(results).toEqual({
          name: "Tim Liu",
          howold: 34,
          title: ["coder", "product", "support"],
          code: "1234"
        });
        return Promise.resolve();
      });
  });

  it("enum replace", () => {

    const dispatcher = {
      resolve: (context, route, input) => {
        if (route.options.name === "getMapForEnum") {
          return {
            1: "New",
            2: "In Progress"
          }
        } else if (route.options.name === "getInverseMap") {
          return {
            "New": 1,
            "In Progress": 2
          }
        }
      }
    };

    const context = new HullVariableContext({
      connector: {
        private_settings: {
          outgoing_user_attributes: [
            { hull: "otherservice/name", service: "name" },
            { hull: "otherservice/lead_status_id", service: "stage" },
            { hull: "otherservice/lead_status_name", service: "Notes" }
          ]
        }
      }
    });
    const initialInput = {
      name: "Tim Liu",
      stage: "New",
      "Notes": 2
    };

    const transformation = [
      {
        target: { type: "input" },
        operateOn: { type: "input", path: "stage" },
        mapOn: {
          key: { type: "input", path: "stage" },
          map: { type: "glue", route: "getInverseMap" }
        },
        output: { path: "stage" }
      },
      {
        target: { type: "input" },
        operateOn: { type: "input", path: "Notes" },
        mapOn: {
          key: { type: "input", path: "Notes" },
          map: { type: "glue", route: "getMapForEnum" }
        },
        output: { path: "Notes" }
      }
    ];

    return performTransformation(dispatcher, context, initialInput, transformation)
      .then((results) => {
        expect(results).toEqual({
          name: "Tim Liu",
          stage: 1,
          Notes: "In Progress"
        });
        return Promise.resolve();
      });
  });

  it("test end to end transformation", () => {

    const dispatcher = {
      resolve: (context, route, input) => {
        return {
          1: "New",
          2: "In Progress"
        }
      }
    };

    const context = new HullVariableContext({});
    const inputType = { name: "InputUser", service_name: "outgoing_input_user"};
    const outputType = { name: "OutputUser", service_name: "outgoing_output_user"};

    const initialInput = {
      name: "Tim Liu",
      "Notes": 2
    };
    setHullDataType(initialInput, inputType);

    const transformations = {
      input: inputType,
      output: outputType,
      strategy: "MixedTransforms",
      transforms: [
        {
          strategy: "AtomicReaction",
          target: { type: "input" },
          operateOn: { type: "input", path: "stage" },
          mapOn: {
            key: { type: "input", path: "stage" },
            map: { type: "glue", route: "getInverseMap" }
          },
          output: { path: "stage" }
        },
        {
          strategy: "AtomicReaction",
          target: { type: "input" },
          operateOn: { type: "input", path: "Notes" },
          mapOn: {
            key: { type: "input", path: "Notes" },
            map: { type: "glue", route: "getMapForEnum" }
          },
          output: { path: "Notes" }
        },
        {
          strategy: "PropertyKeyedValue",
          transforms: [
            {
              inputPath: "name",
              outputPath: "wholename",
              outputFormat: {
                value: "${value}",
                operation: "setIfNull"
              }
            },
            {
              inputPath: "Notes",
              outputPath: "leadStage",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            }
          ]
        },
        {
          strategy: "PropertyKeyedValue",
          transforms: [
            {
              mapping: { type: "input" },
              inputPath: "${service_field_name}",
              outputPath: "${service_field_name}"
            },
            {
              outputPath: "type",
              outputFormat: {
                value: "somelead",
                operation: "set"
              }
            }
          ]
        }
      ]
    };

    return new TransformImpl([transformations]).transform(dispatcher, context, initialInput, outputType)
      .then((results) => {
        expect(results).toEqual({
          wholename: {
            value: "Tim Liu",
            operation: "setIfNull"
          },
          leadStage: {
            value: "In Progress",
            operation: "set"
          },
          type: {
            value: "somelead",
            operation: "set"
          }

        });
        return Promise.resolve();
      });
  });
});
