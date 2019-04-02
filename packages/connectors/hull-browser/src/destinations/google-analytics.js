// // @flow
//
// import type { PublicUpdate } from "../../types";
// // import { map } from "lodash";
//
// export default function googleanalytics(
//   {
//     user,
//     // events,
//     // account,
//     user_segments,
//     destinations
//   }: PublicUpdate // changes, // settings = {}
// ) {
//   if (destinations.google_analytics.userId && window.ga) {
//     window.ga("set", "userId", destinations.google_analytics.userId);
//   }
//
//   // const { ga_mapping = {} } = settings;
//   // if (window.ga) {
//   //   map(ga_mapping, (serviceKey, hullKey) => {
//   //     const v = user[hullKey];
//   //     v !== undefined && window.ga("set", v, user[k]);
//   //   });
//   //   map(ga_segments);
//   // }
//
//   // const { tag, payload } = settings;
//   // const dl = window.dataLayer || [];
//   // dl.push({
//   //   ...user,
//   //   segments: user_segments
//   // });
// }
//
// // ga(function(tracker) {
// //   Hull.alias(`ga:${tracker.get('clientId')}`);
// // });
