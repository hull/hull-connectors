// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullUISelectResponse
} from "hull";
import rp from "request-promise";

import _ from "lodash";

export default async function selectList(
  ctx: HullContext
  // message: HullIncomingHandlerMessage
): HullUISelectResponse {
  const { connector } = ctx;
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

  // Only allow to select if list is unknown
  if (mailchimp_list_id) {
    const list = _.find(data.lists, l => l.id == mailchimp_list_id);
    return {
      status: 200,
      data: {
        options: [
          {
            label: "List selected. Please reinstall the connector to change it",
            options: [
              {
                label: list.name,
                value: mailchimp_list_id
              }
            ]
          }
        ]
      }
    };
  }

  return {
    status: 200,
    data: {
      options: data.lists.map(({ id: value, name: label }) => ({
        label,
        value
      }))
    }
  };
}
