// // @flow
//
// import type { HullContext } from "hull";
// import type { UpdateResponse } from "./agent-details";
//
// const URL = "https://phantombuster.com/api/v1";
//
// const agentUrl = (id, key) =>
//   `${URL}/agent/${id}/launch?output=event-stream&key=${key}`;
//
// type CallApiResponse =
//   | {
//       agent: UpdateResponse,
//       skipped?: boolean,
//       data?: Array<any> | {}
//     }
//   | { error: string };
//
// export default async function callApi(
//   ctx: HullContext
// ): Promise<CallApiResponse> {
//   const { connector } = ctx;
//   const { private_settings = {} } = connector;
//   const { id, api_key } = private_settings;
//
//   if (!id) {
//     throw new Error(
//       "No Phantom ID defined. Please enter an Phantom ID. Visit the Phantom in Phantombuster and copy the Identifier in the URL: `https://phantombuster.com/xxx/phantoms/PHANTOM_ID_IS_HERE`"
//     );
//   }
//   // Set Headers
//   if (!api_key) {
//     throw new Error(
//       "No API Key defined, checkout https://support.phantombuster.com/hc/en-001/articles/360010229440-How-to-find-my-API-key"
//     );
//   }
//
//   // start new connection to the Phantombuster API in event-stream mode
//   const eventSource = new EventSource(agentUrl(id, api_key));
//
//   eventSource.onopen = () => {
//     // when the connection opens, we know the agent was queued successfully
//   };
//
//   eventSource.onmessage = e => {
//     // when we receive the first message, we know the agent is running
//     // console.log(e.data)
//   };
//
//   eventSource.onerror = _e => eventSource.close();
// }
