// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullSettingsResponse
} from "hull";
import moment from "moment";

const SyncAgent = require("../lib/sync-agent");

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullSettingsResponse => {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { access_token, refresh_token } = private_settings;

  try {
    if (!access_token || !refresh_token) {
      throw new Error("Can't find access token");
    }

    return {
      status: 200,
      data: {
        message: "Connected"
      }
    };
  } catch (err) {
    return {
      status: 400,
      data: {
        message: err.message
      }
    };
  }
};

export default statusHandler;
