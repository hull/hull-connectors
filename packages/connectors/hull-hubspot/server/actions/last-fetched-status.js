// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullSettingsResponse
} from "hull";
import moment from "moment";

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullSettingsResponse => {
  try {
    const { connector } = ctx;
    const { private_settings = {} } = connector;
    const {
      last_fetch_started_at,
      fetch_count = 0,
      fetch_account_count = 0
    } = private_settings;

    const date = moment(last_fetch_started_at).format(
      "dddd[,] MMMM D [@] H[h]mm"
    );

    const message = last_fetch_started_at
      ? `${fetch_count} users and ${fetch_account_count} accounts on ${date}`
      : "Never";

    const html = `<span>${fetch_count}</span> users and <span>${fetch_account_count}</span> accounts on <span>${date}</span>`;
    return {
      status: 200,
      data: {
        message,
        html
      }
    };
  } catch (err) {
    return {
      status: 400,
      data: {
        message: "Please reconfigure your connector"
      }
    };
  }
};

export default statusHandler;
