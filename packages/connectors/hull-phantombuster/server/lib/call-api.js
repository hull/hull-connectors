// @flow

import type { HullContext } from "hull";
import type { PhantomAgent } from "./agent-details";
import handleResponseError from "./handle-response-error";

const URL = "https://cache1.phantombooster.com";
const resultUrl = ({ userAwsFolder, awsFolder }) =>
  `${URL}/${userAwsFolder}/${awsFolder}/result.json`;
type Output =
  | {
      status: "success",
      data: {
        runningContainers: number,
        queuedContainers: number,
        messages: Array<string>,
        progress: {
          progress: null | string,
          label: null | string,
          runtime: null | string
        },
        agentStatus: string,
        containerId: string,
        containerStatus: string,
        output: string,
        outputPos: number,
        resultObject: string
      }
    }
  | {
      status: "error",
      error: string
    };

type Response = { body: Output, ok: true } | { error: string, ok: false };

type AgentOutput =
  | {
      skipped?: boolean,
      data?: Array<string | {}> | {}
    }
  | { error: string };

export default async function callApi(
  ctx: HullContext,
  agent: PhantomAgent
): Promise<AgentOutput> {
  const { metric, request, client, connector } = ctx;
  const { private_settings = {} } = connector;
  const { agent_id, api_key } = private_settings;

  if (!agent_id) {
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
  request.type("json").set({
    "X-Phantombuster-key": api_key
  });

  metric.increment("ship.service_api.call");

  try {
    // $FlowFixMe
    const response: Response = await request.get(resultUrl(agent));
    if (!response.ok || response.error) {
      const err = new Error(response.error);
      throw err;
    }

    return response.body;
  } catch (err) {
    client.logger.error("connector.schedule.error", err);
    throw err;
  }
}
