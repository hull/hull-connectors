// @flow
import type {
  HullContext,
  HullUser,
  HullEvent,
  HullSegment,
  HullIncomingHandlerMessage,
  HullExternalResponse,
  HullUserUpdateMessage
} from "hull";
import _ from "lodash";

export default async function getUser(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { connector } = ctx;
  const { private_settings } = connector;
  const { code } = private_settings;
  const { query } = message;
  const { names, claim, service, claimType, entity = "user" } = query;
  try {
    const getter =
      entity === "account" ? ctx.entities.accounts : ctx.entities.users;
    const data = await getter.get({
      claim,
      claimType,
      service,
      include: {
        events: {
          names,
          limit: 1,
          page: 1
        }
      }
    });
    return {
      status: 200,
      data
    };
  } catch (err) {
    ctx.client.logger.error("fetch.user.error", { error: err.message });
    return {
      status: 200,
      error: err.message
    };
  }
}
// https://hull-sidebar.eu.ngrok.io/entity/5d0b9938c29af2d3de000030/OmQ9dvOsOOb0sYGByfRy%2F1t6q6D%2Brppnv6%2FQ4RGGYZ18%2FHGPsSDn0ulohT0yTonK7dx9qT7QSAqESGIQxURJB8vhPknLEvQbpKD5cTDYiUNVmcd6iojbQyxGVsyhLvF71FpK5L%2B5%2Faai7plVoCJ79Q%3D%3D?claimType=service_id&service=intercom&claim=519feb0a25558371a40096bb
