// @flow

import _ from "lodash";
import type { HullContext } from "hull";
import checkConfig from "./check-config";

type Output = {
  maxLimitReached: boolean,
  containers: Array<{
    id: string,
    status: "finished" | "error",
    createdAt: number,
    launchType: string,
    endType: string,
    endedAt: number,
    exitCode: number,
    retryNumber: number
  }>
};

type AgentOutput = Array<string | {}>;

export default async function fetchOutput(
  ctx: HullContext,
  id: string
): Promise<AgentOutput> {
  const { metric, request, client, connector } = ctx;
  const { private_settings = {} } = connector;
  const { api_key } = private_settings;

  checkConfig(ctx);

  if (!id) {
    throw new Error(
      "No Phantom ID defined. Please enter an Phantom ID. Visit the Phantom in Phantombuster and copy the Identifier in the URL: `https://phantombuster.com/xxx/phantoms/PHANTOM_ID_IS_HERE`"
    );
  }
  // Set Headers
  if (!api_key) {
    throw new Error(
      "No API Key defined, checkout https://support.phantombuster.com/hc/en-001/articles/360010229440-How-to-find-my-API-key"
    );
  }

  metric.increment("ship.service_api.call");

  try {
    const containerOutput: Output = await request
      .type("json")
      .set({
        "x-phantombuster-key": api_key
      })
      .get(`/containers/fetch-all?agentId=${id}&mode=finalized`);

    const containerId = _.get(containerOutput, "body.containers.0.id");

    if (!containerId) {
      throw new Error(
        "Can't find a phantombuster container. Check if the Agent has run successfully in Phantombuster at least once"
      );
    }

    const resultObject = await request.get(
      `/containers/fetch-result-object?id=${containerId}`
    );

    // $FlowFixMe
    const result = _.get(resultObject, "body.resultObject");
    if (!result) return [];
    const parsedResult = JSON.parse(result);
    if (_.isArray(parsedResult)) {
      return parsedResult;
    }
    if (parsedResult.csvURL) {
      const { helpers } = ctx;
      const { streamRequest } = helpers;
      return new Promise((resolve, reject) =>
        streamRequest({
          url: parsedResult.csvURL,
          format: "csv",
          batchSize: 100,
          limit: 100,
          onError: error => reject(error),
          onEnd: () => {},
          onData: async data => {
            resolve(data);
          }
        })
      );
    }
    client.logger.error("connector.schedule.error", { result });
    throw new Error("Unrecognized Container result format");
  } catch (err) {
    client.logger.error("connector.schedule.error", err);
    throw err;
  }
}
