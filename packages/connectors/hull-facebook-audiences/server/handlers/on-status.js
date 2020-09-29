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
  const { facebook_access_token, facebook_ad_account_id } = private_settings;
  try {
    if (!facebook_access_token) {
      throw new Error("Please authenticate with Facebook to continue");
    }
    if (facebook_ad_account_id) {
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
          'Select an audience below in the "Select ad account" section to complete setup'
      }
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        message: error.message
      }
    };
  }
}
