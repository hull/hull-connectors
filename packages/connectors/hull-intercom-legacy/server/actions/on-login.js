/* @flow */
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";

const onLogin = async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  return {
    status: 200,
    data: { ...message.body, ...message.query }
  };
};

export default onLogin;
