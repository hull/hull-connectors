// @flow

import type { HullContext } from "hull";

const URL = "https://cache1.phantombooster.com";
const resultUrl = ({ agent, org }) =>
  `${URL}/${org.s3Folder}/${agent.s3Folder}/result.csv`;

export default function getResultsUrl(
  ctx: HullContext,
  agent: {
    s3Folder: string
  },
  org: {
    s3Folder: string
  }
) {
  if (!agent.s3Folder || !org.s3Folder) {
    throw new Error(
      "Can't find an agent or organization to fetch results from"
    );
  }
  return resultUrl({ agent, org });
}
