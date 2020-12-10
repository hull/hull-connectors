// @flow

import type { HullContext, HullExternalResponse } from "hull";

type HandlerFunc = any => any;

const update = (handler: HandlerFunc) => async (
  ctx: HullContext
): Promise<HullExternalResponse> => {
  const { connector, client, request } = ctx;
  const { private_settings } = connector;
  try {
    const response = await handler({ hull: client, private_settings, request });
    client.logger.info("incoming.job.success", { response });
    return response;
  } catch (err) {
    client.logger.error("incoming.job.error", { error: err.message });
    return err;
  }
};

export default update;
