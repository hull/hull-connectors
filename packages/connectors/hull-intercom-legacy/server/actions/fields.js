// @flow

import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");
const IntercomClient = require("../lib/intercom-client");
const IntercomAgent = require("../lib/intercom-agent");

async function fields(ctx: HullContext): HullExternalResponse {
  const privateSettings = ctx.connector.private_settings;

  const intercomClient = new IntercomClient(ctx);
  const intercomAgent = new IntercomAgent(intercomClient, ctx);

  const { custom_attributes } = privateSettings;
  const attributes = await intercomAgent.getAttributes();
  const attributeNames = _.filter(attributes, {
    api_writable: true
  }).map(result => result.name);

  const fieldsList = _.compact(
    _.uniq(_.concat(custom_attributes, attributeNames))
  );

  const options = fieldsList.map(f => {
    return { label: f, value: f };
  });
  return {
    status: 200,
    data: {
      options
    }
  };
}

module.exports = fields;
