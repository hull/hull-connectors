const glue = require("../../server/glue");
const transforms = require("../../server/transforms-to-hull");
const { HullDispatcher } = require("hull-connector-framework/src/purplefusion/dispatcher");


describe("Fetch All Leads", () => {
  test("should initialize the util with the default options", (done) => {
    const dispatcher = new HullDispatcher(glue, { marketo: { endpoints: { getAuthenticationToken: ""}} }, transforms, "ensureSetup");

    const dispatcherSpy = jest.spyOn(dispatcher, "resolve");
    const context = {
      connector: {
        private_settings: {
          marketo_client_id: "asdf",
          // marketo_client_secret: "1234",
          marketo_identity_url: "https://asdf.marketo.com/identity"
        }
      }};
    dispatcher.dispatch(context, "fetchAllLeads")
      .then((results) => {
        expect(dispatcherSpy).toHaveBeenCalled();
        done();
      });
  });

});
