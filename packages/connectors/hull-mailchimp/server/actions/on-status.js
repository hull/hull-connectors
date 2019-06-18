// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullSettingsResponse
} from "hull";

export default async function onStatus(
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullSettingsResponse {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { mailchimp_list_id, api_key, api_endpoint, domain } = private_settings;
  if (domain && api_endpoint && api_key) {
    if (mailchimp_list_id) {
      return {
        status: 200,
        data: {
          message: "Connected to Mailchimp",
          html: "Connected to Mailchimp"
        }
      };
    }
    return {
      status: 200,
      data: {
        message: "Select a list in the section below to complete setup"
      }
    };
  }
  return {
    status: 200,
    data: {
      message: "Please authenticate with Mailchimp to continue"
    }
  };
}
