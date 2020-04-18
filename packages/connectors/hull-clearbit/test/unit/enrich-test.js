// /* eslint-env node, mocha */
// const moment = require("moment");
//
// const assert = require("assert");
// const { expect } = require("chai");
// const sinon = require("sinon");
// const { shouldEnrich, enrich } = require("../../server/clearbit/enrich");
//
// const Clearbit = require("../../server/clearbit").default;
//
// describe("enrich module", () => {
//   describe("shouldEnrich", () => {
//     it("can't enrich people who have no email", () => {
//       assert.deepStrictEqual(shouldEnrich({}, { user: { id: "1234" } }), {
//         should: false,
//         message: "Cannot Enrich because missing email or domain"
//       });
//     });
//     it("can't enrich accounts who have no domain", () => {
//       assert.deepStrictEqual(shouldEnrich({}, { account: { id: "1234" } }), {
//         should: false,
//         message: "Cannot Enrich because missing email or domain"
//       });
//     });
//
//     it("can't enrich users if no segments are defined", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_user_segments: []
//           },
//           {
//             user: { email: "romain@hull.io" }
//           }
//         ),
//         {
//           should: false,
//           message: "No enrich segments defined for User"
//         }
//       );
//     });
//     it("can't enrich accounts if no segments are defined", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: []
//           },
//           {
//             account: { domain: "hull.io" }
//           }
//         ),
//         {
//           should: false,
//           message: "No enrich segments defined for Account"
//         }
//       );
//     });
//
//     it("can't enrich users if a Clearbit ID is present", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_user_segments: ["1"]
//           },
//           {
//             segments: [{ id: "1" }],
//             user: { email: "romain@hull.io", "clearbit/id": "1234" }
//           }
//         ),
//         {
//           should: false,
//           message: "Clearbit ID present"
//         }
//       );
//     });
//     it("can't enrich accounts if a Clearbit ID is present", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: ["1"]
//           },
//           {
//             account_segments: [{ id: "1" }],
//             account: { domain: "hull.io", "clearbit/id": "1234" }
//           }
//         ),
//         {
//           should: false,
//           message: "Clearbit ID present"
//         }
//       );
//     });
//
//     it("can't enrich users if no segments match", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_user_segments: ["1"]
//           },
//           {
//             segments: [{ id: "2" }],
//             user: { email: "romain@hull.io" }
//           }
//         ),
//         {
//           should: false,
//           message: "Enrich Segments are defined but User isn't in any of them"
//         }
//       );
//     });
//     it("can't enrich accounts if no segments match", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: ["1"]
//           },
//           {
//             account_segments: [{ id: "2" }],
//             account: { domain: "hull.io" }
//           }
//         ),
//         {
//           should: false,
//           message:
//             "Enrich Segments are defined but Account isn't in any of them"
//         }
//       );
//     });
//
//     it("can't enrich users if enriched_at present", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_user_segments: ["1"]
//           },
//           {
//             segments: [{ id: "1" }],
//             user: {
//               email: "romain@hull.io",
//               "clearbit/enriched_at": "2018"
//             }
//           }
//         ),
//         {
//           should: false,
//           message: "enriched_at present"
//         }
//       );
//     });
//     it("can't enrich accounts if enriched_at present", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: ["1"]
//           },
//           {
//             account_segments: [{ id: "1" }],
//             account: { domain: "hull.io", "clearbit/enriched_at": "2018" }
//           }
//         ),
//         {
//           should: false,
//           message: "enriched_at present"
//         }
//       );
//     });
//
//     it("Enriches users if everything OK", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_user_segments: ["1"]
//           },
//           {
//             segments: [{ id: "1" }],
//             user: {
//               email: "romain@hull.io"
//             }
//           }
//         ),
//         {
//           should: true
//         }
//       );
//     });
//     it("Enriches accounts if everything OK", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: ["1"]
//           },
//           {
//             account_segments: [{ id: "1" }],
//             account: { domain: "hull.io" }
//           }
//         ),
//         {
//           should: true
//         }
//       );
//     });
//
//     it("enriches if both are present but only user matches", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: ["1"],
//             enrich_user_segments: ["1"]
//           },
//           {
//             segments: [{ id: "1" }],
//             user: { email: "romain@hull.io" },
//             account_segments: [{ id: "2" }],
//             account: { domain: "hull.io" }
//           }
//         ),
//         {
//           should: true
//         }
//       );
//     });
//
//     it("doesn't enrich if both are present but only account matches", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: ["1"],
//             enrich_user_segments: ["1"]
//           },
//           {
//             segments: [{ id: "2" }],
//             user: { email: "romain@hull.io" },
//             account_segments: [{ id: "1" }],
//             account: { domain: "hull.io" }
//           }
//         ),
//         {
//           should: false,
//           message: "Enrich Segments are defined but User isn't in any of them"
//         }
//       );
//     });
//
//     it("works again enrich if only account is present", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: ["1"],
//             enrich_user_segments: ["1"]
//           },
//           {
//             account_segments: [{ id: "1" }],
//             account: { domain: "hull.io" }
//           }
//         ),
//         {
//           should: true
//         }
//       );
//     });
//
//     // BEHAVIOUR CHANGE -> does it change with account enrichment now ?
//     // can we rely only on the `fetched_at` attribute ?
//     // it("can't enrich users if they have a clearbit company (because some have no role)", () => {
//     //   assert.deepStrictEqual(
//     //     shouldEnrich(
//     //       {
//     //         enrich_account_segments: ["1"],
//     //         enrich_user_segments: ["1"]
//     //       },
//     //       {
//     //         account_segments: [{ id: "1" }],
//     //         account: { domain: "hull.io", "clearbit/fetched_at": "2018" },
//     //         segments: [{ id: "1" }],
//     //         user: { email: "romain@hull.io" }
//     //       }
//     //     ),
//     //     {
//     //       should: true
//     //     }
//     //   );
//     // });
//
//     it("should enrich people who have been revealed but not enriched", () => {
//       assert.deepStrictEqual(
//         shouldEnrich(
//           {
//             enrich_account_segments: ["1"],
//             enrich_user_segments: ["1"]
//           },
//           {
//             segments: [{ id: "1" }],
//             user: { email: "romain@hull.io", "traits/revealed_at": "2018" },
//             account_segments: [{ id: "1" }],
//             account: { domain: "hull.io" }
//           }
//         ),
//         {
//           should: true
//         }
//       );
//     });
//   });
//   const formatEnrichPayload = payload => {
//     const {
//       email,
//       given_name,
//       family_name,
//
//       domain,
//       company_name,
//
//       stream,
//       webhook_id,
//       webhook_url
//     } = payload;
//     return Promise.resolve({
//       meta: {
//         webhook_id,
//         webhook_url,
//         stream
//       },
//       person: {
//         email,
//         given_name,
//         family_name
//       },
//       account: {
//         domain,
//         company_name
//       }
//     });
//   };
//   describe("enrich", () => {
//     it("should call the enrich api with proper params with Streaming On", async () => {
//       const enricher = sinon.spy(formatEnrichPayload);
//       const res = await enrich({
//         settings: {
//           stream: true
//         },
//         connector_id: "1234",
//         hostname: "localhost",
//         client: {
//           enrich: enricher
//         },
//         message: {
//           user: {},
//           account: { domain: "hull.io", name: "Hull" }
//         }
//       });
//       assert.deepStrictEqual(res, {
//         source: "enrich",
//         person: {
//           email: undefined,
//           family_name: undefined,
//           given_name: undefined
//         },
//         account: {
//           domain: "hull.io",
//           company_name: "Hull"
//         },
//         meta: {
//           stream: true,
//           webhook_id: undefined,
//           webhook_url:
//             "https://localhost/clearbit-enrich?ship=1234&id=webhookId"
//         }
//       });
//     });
//
//     it("should call the enrich api with proper params with streaming Off", async () => {
//       const enricher = sinon.spy(formatEnrichPayload);
//       const res = await enrich({
//         settings: {
//           stream: false
//         },
//         connector_id: "1234",
//         hostname: "localhost",
//         client: {
//           enrich: enricher
//         },
//         message: {
//           user: {},
//           account: { domain: "hull.io", name: "Hull" }
//         }
//       });
//       assert.deepStrictEqual(res, {
//         source: "enrich",
//         person: {
//           email: undefined,
//           family_name: undefined,
//           given_name: undefined
//         },
//         account: {
//           domain: "hull.io",
//           company_name: "Hull"
//         },
//         meta: {
//           stream: false,
//           webhook_id: "webhookId",
//           webhook_url:
//             "https://localhost/clearbit-enrich?ship=1234&id=webhookId"
//         }
//       });
//     });
//
//     it("should call the enrich api with proper params with no hostname", async () => {
//       const enricher = sinon.spy(formatEnrichPayload);
//       const res = await enrich({
//         settings: {
//           stream: false
//         },
//         connector_id: "1234",
//         hostname: "localhost",
//         client: {
//           enrich: enricher
//         },
//         message: {
//           user: {},
//           account: { domain: "hull.io", name: "Hull" }
//         }
//       });
//       assert.deepStrictEqual(res, {
//         source: "enrich",
//         person: {
//           email: undefined,
//           family_name: undefined,
//           given_name: undefined
//         },
//         account: {
//           domain: "hull.io",
//           company_name: "Hull"
//         },
//         meta: {
//           stream: false,
//           webhook_id: "webhookId",
//           webhook_url:
//             "https://localhost/clearbit-enrich?ship=1234&id=webhookId"
//         }
//       });
//     });
//   });
// });
