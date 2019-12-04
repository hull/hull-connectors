/* @flow */
const _ = require("lodash");

const { performTransformation } = require("hull-connector-framework/src/purplefusion/transform-utils");
const { setHullDataType } = require("hull-connector-framework/src/purplefusion/utils");
const HullVariableContext = require("hull-connector-framework/src/purplefusion/variable-context");
const { TransformImpl } = require("hull-connector-framework/src/purplefusion/transform-impl");

const transforms = require("../../server/transforms-to-hull");

const {
  ServiceUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  OutreachEventRead
} = require("../../server/service-objects");

describe("Transformation tests", () => {

  it("test validation of transformation", async () => {


    const context = new HullVariableContext({});

    const initialInput = {
      "type": "event",
      "id": 87,
      "attributes": {
      "body": null,
        "createdAt": "2018-09-26T20:35:51.000Z",
        "eventAt": "2018-09-26T20:35:51.000Z",
        "externalUrl": null,
        "mailingId": 1,
        "name": "bad_name",
        "payload": null,
        "requestCity": "Mountain View",
        "requestDevice": "desktop",
        "requestHost": null,
        "requestProxied": true,
        "requestRegion": "CA"
    },
      "relationships": {
      "mailing": {
        "data": {
          "type": "mailing",
            "id": 1
        }
      },
      "prospect": {
        "data": {
          "type": "prospect",
            "id": 3
        }
      },
      "user": {
        "data": {
          "type": "user",
            "id": 1
        }
      }
    },
      "links": {
      "self": "https://api.outreach.io/api/v2/events/87"
    }
    };
    setHullDataType(initialInput, OutreachEventRead);

    return expect(new TransformImpl(transforms).transform(null, context, initialInput, ServiceUserRaw))
      .rejects.toThrow();
  });
});
