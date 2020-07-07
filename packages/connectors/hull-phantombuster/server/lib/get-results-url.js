// @flow

import type { HullContext } from "hull";

const URL = "https://cache1.phantombooster.com";
const resultUrl = ({ userAwsFolder, awsFolder }) =>
  `${URL}/${userAwsFolder}/${awsFolder}/result.csv`;

export default function getResultsUrl(
  ctx: HullContext,
  agent: {
    userAwsFolder: string,
    awsFolder: string
  }
) {
  const { userAwsFolder, awsFolder } =
    agent || ctx?.connector?.private_settings?.agent || {};
  if (!userAwsFolder || !awsFolder) {
    throw new Error("Can't find an agent to fetch results from");
  }
  return resultUrl({ userAwsFolder, awsFolder });
}
