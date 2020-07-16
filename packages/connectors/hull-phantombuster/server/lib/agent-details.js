// @flow
import _ from "lodash";
import type { HullContext } from "hull";
import handleResponseError from "./handle-response-error";
import checkConfig from "./check-config";

export type PhantomAgent = {
  id: string,
  name: string,
  scriptId: string,
  disableWebSecurity: boolean,
  ignoreSslErrors: boolean,
  loadImages: boolean,
  launch: string,
  nbLaunches: number,
  showDebug: boolean,
  awsFolder: string,
  fileMgmt: string,
  lastEndMessage: string,
  lastEndStatus: string,
  userAwsFolder: string,
  nonce: number,
  isNew: boolean
};
export default async function updateAgentDetails(
  ctx: HullContext,
  update: boolean
): Promise<PhantomAgent> {
  const { connector, request, helpers } = ctx;
  const { private_settings = {} } = connector;
  const { agent_id, api_key, agent = {} } = private_settings;
  const { lastEndedAt } = agent;

  checkConfig(ctx);

  request.type("json").set({
    "X-Phantombuster-key": api_key
  });

  const [agentResponse, orgResponse] = await Promise.all([
    request.get(`/agents/fetch?id=${agent_id}`),
    request.get("/orgs/fetch")
  ]);

  const error = handleResponseError(agentResponse);

  if (error) {
    const err = new Error(error);
    err.data = { body: agentResponse.body };
    throw err;
  }

  const isNew = lastEndedAt !== agentResponse.body.lastEndedAt;
  const output = {
    agent: _.omit(agentResponse.body, ["argument", "repeatedLaunchTimes"]),
    org: orgResponse.body
  };
  if (update) {
    await helpers.settingsUpdate(output);
  }
  // $FlowFixMe
  return {
    agent: {
      ...output.agent,
      isNew
    },
    org: output.org
  };
}
