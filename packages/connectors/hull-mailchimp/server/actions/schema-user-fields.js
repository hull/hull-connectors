/* @flow */
import type { HullContext } from "hull";

const shipAppFactory = require("../lib/ship-app-factory");

async function schemaUserFields(ctx: HullContext) {
  try {
    const resBody = await shipAppFactory(ctx).mailchimpAgent.getMergeFields();
    return {
      options: (resBody.merge_fields || []).map(f => {
        return { label: f.name, value: f.tag };
      })
    };
  } catch (err) {
    return { options: [] };
  }
}

module.exports = schemaUserFields;
