const Minihull = require("minihull");
const expect = require("chai").expect;
const moment = require("moment");
const sinon = require("sinon");
const assert = require("assert");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";
process.env.OVERRIDE_HUBSPOT_URL = "http://localhost:8002";
process.env.TZ = "UTC";
process.env.FETCH_CONTACTS_COUNT = 2;

const Minihubspot = require("./support/minihubspot");
const bootstrap = require("./support/bootstrap");

describe("Hubspot fetchContacts", function test() {
  let server, minihull, minihubspot, connector;
  beforeEach((done) => {
    minihull = new Minihull();
    minihubspot = new Minihubspot();
    server = bootstrap(8000);
    connector = {
      id: "123456789012345678901234",
      private_settings: {
        token: "hubspotABC",
      }
    };
    minihull.stubConnector(connector);
    minihull.stubUsersSegments([]);
    minihull.stubAccountsSegments([]);
    minihubspot.listen(8002);
    minihull.listen(8001).then(done);
  });

  it("should return status OK with data from hubspot", (done) => {
    minihubspot.stubApp("/contacts/v2/groups")
      .callsFake((req, res) => {
        res.json([{
          displayName: "display",
          properties: [
            {
              label: "coke",
              name: "shortName"
            }
          ]
        }]);
      });
    minihull.postConnector(connector, "http://localhost:8000/schema/contact_properties")
      .then((response) => {
        assert(response.statusCode === 200);
        console.log(response.body);
        const parsedBody = response.body.options[0];
        assert(parsedBody.label === "display");
        assert(parsedBody.options[0].label === "coke");
        assert(parsedBody.options[0].value === "shortName");
        done();
      })
      .catch(err => console.log(err))
    });

  afterEach(() => {
    minihull.close();
    minihubspot.close();
    server.close();
  });
});
