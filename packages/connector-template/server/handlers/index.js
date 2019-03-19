// // @flow
// import type { HullHandlersConfiguration } from "hull";
// import status from "../actions/status";
// import account_update from "./account-update";
// import user_update from "./user-update";
// import ship_update from "./ship-update";
// import users_segment_update from "./users-segment-update";
// import accounts_segment_update from "./accounts-segment-update";
//
// const schedules = [
//   {
//     url: "/status",
//     handler: {
//       callback: status,
//       options: {}
//     }
//   }
// ];
// const notifications = [
//   {
//     url: "/smart-notifier",
//     handlers: {
//       "user:update": {
//         callback: user_update
//       },
//       "account:update": {
//         callback: account_update
//       },
//       "ship:update": {
//         callback: ship_update
//       },
//       "users_segment:update": {
//         callback: users_segment_update
//       },
//       "accounts_segment:update": {
//         callback: accounts_segment_update
//       }
//     }
//   }
// ];
// const batches = [
//   {
//     url: "/batch",
//     handlers: {
//       "user:update": {
//         callback: user_update
//       },
//       "account:update": {
//         callback: account_update
//       }
//     }
//   }
// ];
// const json = [
//   {
//     url: "/fetch-all",
//     handler: {
//       callback: () => {},
//       options: {}
//     }
//   }
// ];
// export default function({
//   hostSecret,
//   clientID,
//   clientSecret
// }: {
//   hostSecret: string,
//   clientID: string,
//   clientSecret: string
// }): HullHandlersConfiguration {
//   return {
//     schedules,
//     notifications,
//     batches,
//     json,
//     routers: [
//       {
//         url: "/auth",
//         handler: oauth({ hostSecret, clientID, clientSecret })
//       }
//     ]
//   };
// }
