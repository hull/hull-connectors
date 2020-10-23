// @flow

import type {
  HullContext,
  // HullResponse,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import { pickValuesFromRequest } from "hull-vm";

type HandlerFunc = any => any;

const update = (handler: HandlerFunc) => async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): Promise<HullExternalResponse> => {
  const { connector, client } = ctx;
  const { private_settings } = connector;
  await handler({
    ...pickValuesFromRequest(message),
    hull: client,
    private_settings
  });
  return {
    status: 200,
    data: {
      ok: true
    }
  };
};

export default update;
