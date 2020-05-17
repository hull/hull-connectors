// @flow
import type { HullContext } from "hull";
import handleResponseError from "./handle-response-error";

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
  const { id, api_key, agent = {} } = private_settings;
  const { nonce } = agent;

  const response = await request
    .get(`https://phantombuster.com/api/v1/agent/${id}`)
    .type("json")
    .set({
      "X-Phantombuster-key": api_key
    });

  const error = handleResponseError(response);

  if (error) {
    const err = new Error(error);
    err.data = { body: response.body };
    throw err;
  }

  const { data } = response.body;

  const isNew = nonce !== data.nonce;
  if (update) {
    await helpers.settingsUpdate({ agent: data });
  }
  // $FlowFixMe
  return {
    ...data,
    isNew
  };
}
