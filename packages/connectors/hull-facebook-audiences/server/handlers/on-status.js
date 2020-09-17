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
  const { facebook_access_token, audience_id } = private_settings;
  if (facebook_access_token) {
    if (audience_id) {
      return {
        status: 200,
        data: {
          message: "Connected to Facebook",
          html: "Connected to Facebook"
        }
      };
    }
    return {
      status: 200,
      data: {
        message:
          "Select an audience in the credentials & action section in the overview tab to complete setup"
      }
    };
  }
  return {
    status: 400,
    data: {
      message: "Please authenticate with Facebook to continue"
    }
  };
}
