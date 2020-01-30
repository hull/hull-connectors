/* @flow */
import type { HullContext } from "hull";

const shipAppFactory = require("../lib/ship-app-factory");

async function schemaUserFields(ctx: HullContext) {
  try {
    const res = await shipAppFactory(ctx).mailchimpAgent.getMergeFields();
    return {
      status: 200,
      data: {
        options: (res.merge_fields || []).map(
          ({ name: label, tag: value }) => ({
            label,
            value
          })
        )
      }
    };
  } catch (err) {
    return { status: 500, data: { options: [], error: err.message } };
  }
}

module.exports = schemaUserFields;
