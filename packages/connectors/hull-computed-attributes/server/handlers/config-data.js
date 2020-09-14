// @flow
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  const eventSchema = await ctx.entities.events.getSchema();
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { code, fallbacks } = private_settings;
  return {
    eventSchema,
    language: "jsonata",
    entity: "user",
    code,
    fallbacks
  };
};

export default configHandler;
