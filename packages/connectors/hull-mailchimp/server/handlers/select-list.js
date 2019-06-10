// @flow
const _ = require("lodash");
import type { HullContext, HullIncomingHandlerMessage } from "hull";
import rp from "request-promise";

export default async function selectList(ctx: HullContext, message: HullIncomingHandlerMessage) {
  const { clientCredentialsEncryptedToken, hostname, connector } = ctx;
  const { api_key, api_endpoint, mailchimp_list_id } =
    connector.private_settings || {};

  const data = await rp({
    uri: `${api_endpoint}/3.0/lists`,
    qs: {
      fields: "lists.id,lists.name",
      count: 250
    },
    headers: { Authorization: `OAuth ${api_key}` },
    json: true
  });

  return {
    pageLocation: "select.html",
    data: {
      form_action: `https://${hostname}/select?hullToken=${clientCredentialsEncryptedToken}`,
      name: "Mailchimp",
      mailchimp_list_id,
      mailchimp_lists: _.sortBy(data.lists, list =>
        (list.name || "").toLowerCase()
      )
    }
  };
}
