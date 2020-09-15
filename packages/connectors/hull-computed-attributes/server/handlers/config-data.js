// @flow
import _ from "lodash";
import type { HullContext } from "hull";
// import type { ConfResponse } from "hull-vm";

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
  const { code, locals, fallbacks } = private_settings;
  return {
    eventSchema,
    userAttributeSchema: _.map(
      _.omitBy(userAttributeSchema, ({ key }) => key.indexOf("account.") === 0),
      attribute => ({ ...attribute, key: `user.${attribute.key}` })
    ),
    accountAttributeSchema: _.map(accountAttributeSchema, attribute => ({
      ...attribute,
      key: `account.${attribute.key}`
    })),
    language: "jsonata",
    entity: "user",
    code,
    locals,
    fallbacks
  };
};

export default configHandler;
