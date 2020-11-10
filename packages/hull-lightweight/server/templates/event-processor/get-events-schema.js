// @flow

import type { HullContext, HullUISelectResponse } from "hull";
import _ from "lodash";

export default async function getEventSchema(
  ctx: HullContext
): HullUISelectResponse {
  const eventSchema = await ctx.entities.events.getSchema();
  return {
    status: 200,
    data: {
      options: _.reduce(
        eventSchema,
        (events, { name, properties, emitted }) => {
          if (emitted) {
            events.push({
              label: name,
              options: properties.map(property => ({
                label: property,
                value: property
              }))
            });
          }
          return events;
        },
        []
      )
    }
  };
}
