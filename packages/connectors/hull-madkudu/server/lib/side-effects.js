// @flow
import type {
  HullContext,
  HullAccountUpdateMessage,
  HullUserUpdateMessage
} from "hull";
import _ from "lodash";
import type { Person, Company } from "./types";

import { updateCall, fetchPerson, fetchCompany } from "./api-calls";
import { getUserPayloads } from "./get-payloads";

export const updateUser = (ctx: HullContext) => async (
  message: HullUserUpdateMessage
) => {
  const {
    request,
    client,
    connector: {
      private_settings: { api_key }
    }
  } = ctx;
  const { user } = message;

  const asUser = client.asUser(user);

  try {
    const payloads = getUserPayloads(ctx, message);
    asUser.logger.debug("outgoing.user.start", {
      operation: "sendUserData",
      payloads
    });
    const details = await Promise.all(
      payloads.map(
        updateCall({
          request,
          api_key
        })
      )
    );
    asUser.logger.info("outgoing.user.success", { details });
    return details;
  } catch (err) {
    asUser.logger.error("outgoing.user.error", {
      message: _.get(err, "message", "Unknown error")
    });
    throw err;
  }
};

export const enrichUser = (ctx: HullContext) => async (
  message: HullUserUpdateMessage
) => {
  if (!message.user.email) {
    throw new Error("Need an email to enrich user");
  }
  const {
    helpers,
    request,
    client,
    connector: {
      private_settings: { api_key, madkudu_person_attributes }
    }
  } = ctx;
  const { mapAttributes } = helpers;
  const asUser = client.asUser(message.user);
  try {
    const payload: Person = await fetchPerson({
      request,
      api_key
    })(message.user.email);
    asUser.logger.info("incoming.user.progress", {
      action: "enrichment",
      data: payload
    });
    await asUser.traits(
      mapAttributes({
        payload,
        mapping: madkudu_person_attributes,
        direction: "incoming"
      })
    );
    return payload;
  } catch (err) {
    asUser.logger.error("incoming.user.error", {
      message: _.get(err, "message", "Unknown error")
    });
    throw err;
  }
};

export const enrichAccount = (ctx: HullContext) => async (
  message: HullAccountUpdateMessage
) => {
  const {
    helpers,
    request,
    client,
    connector: {
      private_settings: { api_key, madkudu_company_attributes }
    }
  } = ctx;
  const { mapAttributes } = helpers;
  const asAccount = client.asAccount(message.account);
  try {
    const payload: Company = await fetchCompany({
      request,
      api_key
    })(message.account.domain);
    asAccount.logger.debug("incoming.account.progress", {
      action: "enrichment",
      data: payload
    });
    await asAccount.traits(
      mapAttributes({
        payload,
        mapping: madkudu_company_attributes,
        direction: "incoming"
      })
    );
    return payload;
  } catch (err) {
    asAccount.logger.error("incoming.account.error", {
      message: _.get(err, "message", "Unknown error")
    });
    throw err;
  }
};
