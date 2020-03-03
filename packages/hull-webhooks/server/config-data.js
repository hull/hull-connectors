// @flow
import type { HullContext } from "hull";
import getHeaders from "./get-headers";

const configHandler = (data: {}) => async (
  ctx: HullContext
): Promise<Object> => {
  const eventSchema = await ctx.entities.events.getSchema();
  return {
    eventSchema,
    url: ctx.connector.private_settings.url,
    headers: getHeaders(ctx),
    language: "jsonata",
    entity: "user",
    ...data
  };
};

export default configHandler;
