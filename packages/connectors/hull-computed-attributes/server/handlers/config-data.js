// @flow
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

const configHandler = async (ctx: HullContext): Promise<Object> => {
  const [eventSchema, attributeSchema] = await Promise.all([
    ctx.entities.events.getSchema(),
    ctx.entities.users.getSchema()
  ]);
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { code, locals, fallbacks } = private_settings;
  return {
    eventSchema,
    attributeSchema,
    language: "jsonata",
    entity: "user",
    code,
    locals,
    fallbacks
  };
};

export default configHandler;
