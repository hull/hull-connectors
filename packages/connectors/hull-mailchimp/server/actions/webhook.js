/* @flow */
/* eslint-disable */
import type { HullContext, HullIncomingHandlerMessage, HullUserClaims } from "hull";

const _ = require("lodash");

const shipAppFactory = require("../lib/ship-app-factory");

function getMemberIdentity(member) {
  const { email, unique_email_id } = member;
  const ident: HullUserClaims = { email: _.toLower(_.toString(email)) };
  if (unique_email_id) {
    ident.anonymous_id = `mailchimp:${_.toString(unique_email_id)}`;
  }

  return ident;
}

async function handleAction(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) {
  const { syncAgent } = shipAppFactory(ctx);
  const { client } = ctx;
  const { body, method = "" } = message;
  if (!body) {
    return {
      statusCode: 404,
      data: {
        ok: false,
        message: "Body isn't a valid object"
      }
    };
  }
  // $FlowFixMe
  const { type = "", data = {} } = body;

  if (method.toLowerCase() === "get") {
    return {
      statusCode: 200,
      data: { ok: true, message: "Webhook registered" }
    };
  }

  client.logger.debug("incoming.webhook.received", { type, data });

  if (!data || !data.email) {
    return {
      statusCode: 404,
      data: { ok: false, message: "Email not found" }
    };
  }
  let processedData = _.cloneDeep(data);
  switch (
    type // eslint-disable-line default-case
    ) {
    case "subscribe":
      processedData = _.merge({}, data, {
        status: "subscribed",
        subscribed: true,
        archived: false
      });
      break;

    case "unsubscribe":

      processedData = _.merge({}, data, {
        status: "unsubscribed",
        subscribed: false,
        archived: data.action === "archive" || data.action === "delete"
      });
      break;

    case "cleaned":
      processedData = _.merge({}, data, {
        status: "cleaned",
        subscribed: false,
        archived: false
      });
      break;

    default:
      try {
        const member = await syncAgent.mailchimpClient.getMemberInfo(data.email);
        if (!_.isEmpty(member)) {
          if (member.status === 404) {
            const ident = getMemberIdentity(data);
            client.asUser(ident).logger.info("incoming.user.error", { "status": 404, "message": `Unable to determine status for email ${data.email}.` });
            /*
            processedData = _.merge({}, data, {
               status: "cleaned",
               value: false
            });
            */
          } else {
            processedData = _.merge({}, data, {
              status: member.status,
              subscribed: member.status === "subscribed",
              archived: false
            });
          }
        }
      } catch (err) {
        const ident = getMemberIdentity(data);
        client.asUser(ident).logger.info("incoming.user.error", { status: err.status, message: err.message });
      }
  }
  await syncAgent.userMappingAgent.updateUser(processedData);

  return {
    statusCode: 200,
    data: { ok: true, message: "Data processed" }
  };
}

module.exports = handleAction;
