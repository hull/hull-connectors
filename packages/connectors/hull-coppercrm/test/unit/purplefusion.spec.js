/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");
const { ContextMock } = require("hull-connector-framework/src/purplefusiontester/connector-mock");
const { setHullDataType } = require("hull-connector-framework/src/purplefusion/utils");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

describe("CopperCRM Incoming Tests", () => {

  const harness = new PurpleFusionTestHarness(
    require("../../server/glue"),
    {
      coppercrm: require("../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    _.concat(
      require("../../server/transforms-to-hull"),
      require("../../server/transforms-to-service")
    ),
    "ensure");

  // const router = new HullRouter({
  //   glue: require("../../server/glue"),
  //   services: { coppercrm:  require("../../server/service")({
  //       clientID: "clientId",
  //       clientSecret: "clientSecret"
  //     })
  //   },
  //   transforms: _.concat(
  //     require("../../server/transforms-to-hull"),
  //     require("../../server/transforms-to-service")
  //   ),
  //   ensureHook: "ensure"
  // });

  expect.extend({
    toBeWithinRange(received, floor, ceiling) {
      const pass = received >= floor && received <= ceiling;
      if (pass) {
        return {
          message: () =>
            `expected ${received} not to be within range ${floor} - ${ceiling}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${received} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      }
    },
  });


  it("fetch all leads coppercrm", () => {
    return harness.runTest(require("./fixtures/fetch-all-leads"));
  });

  it("fetch recent leads coppercrm", () => {
    return harness.runTest(require("./fixtures/fetch-recent-leads"));
  });

  it("fetch all people coppercrm", () => {
    return harness.runTest(require("./fixtures/fetchAllPeople"));
  });

  it("fetch all companies coppercrm", () => {
    return harness.runTest(require("./fixtures/fetchAllCompanies"));
  });

  it("fetch all opportunities coppercrm", () => {
    return harness.runTest(require("./fixtures/fetchAllOpportunities"));
  });

  it("fetch recent opportunities coppercrm", () => {
    return harness.runTest(require("./fixtures/fetchRecentOpportunities"));
  });


  it("fetch all activities coppercrm", () => {
    return harness.runTest(require("./fixtures/fetchAllActivities"));
  });

  it("ship update to resolve webhooks", () => {
    return harness.runTest(require("./fixtures/shipUpdate"));
  });

  it("webhook for lead deleted", () => {
    return harness.runTest(require("./fixtures/webhooks"));
  });

  it("webhook for deleted accounts", () => {
    return harness.runTest(require("./fixtures/webhooks-deleted-account"));
  });

  it("lead upsert", () => {
    return harness.runTest(require("./fixtures/leadUpdate"));
  });

  it("lead update", () => {
    return harness.runTest(require("./fixtures/leadUpdate_update_email"));
  });

//   it("fetch recent coppercrm", () => {
//     const requestTrace = require("./fixtures/fetchAllActivities");
//     return harness.runTest(requestTrace);
//     // const requestTrace = require("./fixtures/fetch-recent-leads");
//   // const context = new ContextMock(requestTrace.configuration);
//   //
//   // let request = requestTrace.input;
//   // if (request && request.classType && request.data) {
//   //   const classType = request.classType;
//   //   const data = request.data;
//   //   setHullDataType(data, classType);
//   //   request = data;
//   // }
//   //
//   // return router.dispatcher().dispatch(context, requestTrace.route, request).catch(error => {
//   //   console.log(error.message);
//   //   console.log(error.stack);
//   //   return Promise.reject(error);
//   // });
// });

});
