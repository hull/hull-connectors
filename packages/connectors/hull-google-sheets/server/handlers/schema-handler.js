// @flow
import _ from "lodash";
import type { HullContext, HullIncomingHandlerMessage } from "hull";
import type { ImportType } from "../../types";

// const USER_OMITTED_KEYS = ["account", "id", "indexed_at", "updated_at"];
// const ACCOUNT_OMITTED_KEYS = ["id", "indexed_at", "updated_at"];
// const omittedKeys = (type = "user") =>
//   type === "user" ? USER_OMITTED_KEYS : ACCOUNT_OMITTED_KEYS;
type SchemaEntry = {
  key: string,
  visible: boolean
};

// const omitHidden = (schema: Array<SchemaEntry>) => _.filter(schema, "visible");
//
// const omitAccounts = (schema: Array<SchemaEntry>) =>
//   _.filter(schema, ({ key }) => key.indexOf("account.") !== 0);
//
// const getKey = (schema: Array<SchemaEntry>) => _.map(schema, "key");

const EXCLUDED = ["anonymous_ids", "external_id", "email", "domain"];

const transformAttributes = ({
  schema,
  type,
  source
}: {
  schema: Array<SchemaEntry>,
  type: ImportType,
  source: string
}) =>
  _.reduce(
    schema,
    (m, { key, visible }) => {
      const k = type === "user" ? key.replace(/traits_/, "") : key;
      if (
        EXCLUDED.includes(k) ||
        !visible ||
        k.indexOf("account.") === 0 ||
        (source && k.indexOf(source) !== 0)
      ) {
        return m;
      }
      m.push(k);
      return m;
    },
    []
  );

const getSchema = async (
  ctx: HullContext,
  type: ImportType,
  source: string
) => {
  if (type === "user") {
    const schema = await ctx.entities.users.getSchema();
    return transformAttributes({ schema, type, source });
  }
  if (type === "account") {
    const schema = await ctx.entities.accounts.getSchema();
    return transformAttributes({ schema, type, source });
  }
  if (type === "user_event") {
    return ctx.entities.events.getSchema();
  }
  throw new Error("Unsupported schema");
};

export default async function returnSchema(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) {
  // $FlowFixMe
  const body: { type?: ImportType, source?: string } = message.body;
  const { type = "user", source = "" } = body;
  try {
    const schema = await getSchema(ctx, type || "user", source);
    return {
      status: 200,
      data: schema
    };
  } catch (e) {
    return {
      status: 500,
      data: {
        error: e.message || e
      }
    };
  }
}
