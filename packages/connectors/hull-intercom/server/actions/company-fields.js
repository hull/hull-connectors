// @flow

import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");
const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");

const defaultAttributes = require("./fields/default-company-fields.json");

async function fields(ctx: HullContext): HullExternalResponse {
  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);

  const attributes = await intercomAgent.getAttributes("company");

  const options = _.concat(defaultAttributes, attributes).map(attribute => {
    return { label: attribute.label, value: attribute.name };
  });
  return {
    status: 200,
    data: {
      options
    }
  };
}

module.exports = fields;
