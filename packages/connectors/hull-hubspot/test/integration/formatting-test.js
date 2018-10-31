const Minihull = require("minihull");
const expect = require("chai").expect;
const moment = require("moment");

const Minihubspot = require("./support/minihubspot");
const bootstrap = require("./support/bootstrap");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";
process.env.OVERRIDE_HUBSPOT_URL = "http://localhost:8002";
process.env.TZ = "UTC";

describe("Hubspot properties formatting", function test() {
  let server, minihull, minihubspot, connector;

  beforeEach((done) => {
    minihull = new Minihull();
    minihubspot = new Minihubspot();
    server = bootstrap(8000);
    connector = {
      id: "123456789012345678901234",
      private_settings: {
        token: "hubspotABC",
        sync_fields_to_hubspot: [{
          name: "custom_date_hubspot_create_at",
          hull: "traits_custom_date_created_at"
        }, {
          name: "custom_hubspot_create_at",
          hull: "traits_custom_created_at"
        }]
      }
    };
    minihubspot.listen(8002);
    minihull.listen(8001).then(done);
  });

  it("should format outgoing traffic correctly", (done) => {
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
    minihubspot.stubApp("post", "/contacts/v1/contact/batch")
      .callsFake((req, res) => {
        res.status(202).end();
      });
    minihull.stubApp("/search/account_reports/bootstrap").respond({});
    minihull.stubApp("/search/user_reports/bootstrap").respond({
      tree: [{
        text: "User",
        children: [
          { id: 'id', text: 'Hull ID', type: 'string' },
          { id: 'email', text: 'Email', type: 'string' },
          { id: 'traits_custom_date_created_at', text: 'traits_custom_date_created_at', type: 'string', default: null },
          { id: 'traits_custom_created_at', text: 'traits_custom_created_at', type: 'string', default: null },
        ]
      }]
    });
    minihull.stubUsersBatch([{
      email: "foo@bar.com",
      traits_custom_created_at: "2016-08-04T12:49:28Z",
      traits_custom_date_created_at: "2016-08-04T12:49:28Z"
    }]);
    minihubspot.on("incoming.request", req => console.log("MINIHUBSPOT", req.method, req.url));
    minihull.batchUsersConnector(connector, "http://localhost:8000/batch");
    minihubspot.on("incoming.request#3", (req) => {
      const lastReq = minihubspot.requests.get("incoming").last().value();
      expect(lastReq.url).to.be.eq("/contacts/v1/contact/batch/?auditId=Hull");
      expect(lastReq.body).to.be.an("array");
      expect(lastReq.body[0]).to.have.property("email");
      expect(lastReq.body[0]).to.have.property("properties");
      const properties = lastReq.body[0].properties;
      expect(properties[0].property).to.equal("hull_custom_date_hubspot_create_at");
      expect(moment(properties[0].value, "x").format()).to.be.equal("2016-08-04T00:00:00+00:00");

      expect(properties[1].property).to.equal("hull_custom_hubspot_create_at");
      expect(moment(properties[1].value, "x").format()).to.be.equal("2016-08-04T12:49:28+00:00");
      done();
    });
  });

  afterEach(() => {
    minihull.close();
    minihubspot.close();
    server.close();
  });
});
