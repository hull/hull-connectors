// @flow
import _ from "lodash";
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

const reduceAttributes = (entity = "user", attributes) =>
  _.reduce(
    attributes,
    (schema, attribute) => {
      const { key } = attribute;
      if (entity === "user" && key.indexOf("account.") === 0) {
        return schema;
      }
      schema.push({
        ...attribute,
        key: `${entity}.${key.replace(/^traits_/, "")}`
      });
      return schema;
    },
    []
  );
const configHandler = async (ctx: HullContext): Promise<Object> => {
  const [
    eventSchema,
    userAttributeSchema,
    accountAttributeSchema
  ] = await Promise.all([
    ctx.entities.events.getSchema(),
    ctx.entities.users.getSchema(),
    ctx.entities.accounts.getSchema()
  ]);
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { computedAttributes } = private_settings;
  return {
    eventSchema,
    userAttributeSchema: reduceAttributes("user", userAttributeSchema),
    accountAttributeSchema: reduceAttributes("account", accountAttributeSchema),
    language: "jsonata",
    entity: "user",
    computedAttributes
  };
};

export default configHandler;
