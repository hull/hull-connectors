/* @flow */
const _ = require("lodash");

const { PurpleFusionTestHarness } = require("hull-connector-framework/src/purplefusiontester/purplefusion-test-harness");
const { ContextMock } = require("hull-connector-framework/src/purplefusiontester/connector-mock");
const { setHullDataType } = require("hull-connector-framework/src/purplefusion/utils");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

describe("CopperCRM Lead Tests", () => {

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

  const router = new HullRouter({
    glue: require("../../server/glue"),
    services: { coppercrm:  require("../../server/service")({
        clientID: "clientId",
        clientSecret: "clientSecret"
      })
    },
    transforms: _.concat(
      require("../../server/transforms-to-hull"),
      require("../../server/transforms-to-service")
    ),
    ensureHook: "ensure"
  });


  it("fetch all leads coppercrm", () => {
    return harness.runTest(require("./fixtures/fetch-all-leads"));
  });

  // it("fetch recent leads coppercrm", () => {
  //   return harness.runTest(require("./fixtures/fetch-recent-leads"));
  // });

  it("fetch all activities coppercrm", () => {
    return harness.runTest(require("./fixtures/fetchAllActivities"));
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
