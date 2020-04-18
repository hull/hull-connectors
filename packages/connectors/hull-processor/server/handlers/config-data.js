// @flow
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  const eventSchema = await ctx.entities.events.getSchema();
  return {
    eventSchema,
    language: ctx.connector.private_settings.language || "javascript",
    entity: "user"
  };
};

export default configHandler;
