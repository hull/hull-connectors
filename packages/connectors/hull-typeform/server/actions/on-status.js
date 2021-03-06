// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullSettingsResponse
} from "hull";

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullSettingsResponse => {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const {
    access_token,
    refresh_token,
    expires_in,
    tokens_granted_at,
    form_id
  } = private_settings;

  if (access_token && refresh_token && expires_in && tokens_granted_at) {
    if (!form_id) {
      return {
        status: 200,
        data: {
          message: "Connected to Typeform. Please select a form to import below"
        }
      };
    }
    return {
      status: 200,
      data: {
        message: `Importing data from: ${form_id}`,
        html: `Importing data from: <span>${form_id}</span>`
      }
    };
  }
  return {
    status: 200,
    data: {
      message: "Can't find Access token or refresh token. Try logging in again"
    }
  };
};

export default statusHandler;
