const Minihull = require("minihull");
const expect = require("chai").expect;
const moment = require("moment");
const sinon = require("sinon");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";
process.env.OVERRIDE_HUBSPOT_URL = "http://localhost:8002";
process.env.TZ = "UTC";
process.env.FETCH_CONTACTS_COUNT = 2;

const Minihubspot = require("./support/minihubspot");
const bootstrap = require("./support/bootstrap");

describe.skip("Hubspot fetchContacts", function test() {
  let server, minihull, minihubspot, clock;
  beforeEach((done) => {
    minihull = new Minihull();
    minihubspot = new Minihubspot();
    server = bootstrap(8000);
    minihull.stubConnector({
      id: "123456789012345678901234",
      private_settings: {
        token: "hubspotABC",
      }
    });
    minihubspot.listen(8002);
    clock = sinon.useFakeTimers();
    minihull.listen(8001).then(done);
  });

  it("should call hubspot recently_updated endpoint", (done) => {
    minihubspot.stubApp("/contacts/v2/groups")
      .callsFake((req, res) => {
        res.json([{
          name: "hull",
          displayName: "Hull Properties",
          displayOrder: 1,
          properties: [{
            name: "hull_custom_hubspot_create_at",
            label: "custom_hubspot_create_at"
          }, {
            name: "hull_custom_date_hubspot_create_at",
            label: "custom_date_hubspot_create_at",
            type: "date"
          }]
        }]);
      });
  });

  afterEach(() => {
    minihull.close();
    minihubspot.close();
    server.close();
    clock.restore();
  });
});

