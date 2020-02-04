// @flow
import type { HullContext } from "hull";
import getHeaders from "../lib/get-headers";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  const eventSchema = await ctx.entities.events.getSchema();
  return {
    eventSchema,
    url: ctx.connector.private_settings.url,
    headers: getHeaders(ctx),
    language: "jsonata",
    entity: "user"
  };
};

export default configHandler;
