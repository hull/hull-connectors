/* @flow */
import type { HullContext } from "hull";

const shipAppFactory = require("../lib/ship-app-factory");

function schemaUserFields(ctx: HullContext) {
  return shipAppFactory(ctx)
    .mailchimpAgent.getMergeFields()
    .then(
      resBody => {
        return {
          options: resBody.merge_fields.map(f => {
            return { label: f.name, value: f.tag };
          })
        };
      },
      () => {
        return { options: [] };
      }
    );
}

module.exports = schemaUserFields;
