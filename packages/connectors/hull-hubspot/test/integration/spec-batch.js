const Minihull = require("minihull");
const expect = require("chai").expect;

const Minihubspot = require("./support/minihubspot");
const bootstrap = require("./support/bootstrap");

process.env.OVERRIDE_HUBSPOT_URL = "http://localhost:8002";

describe("Hubspot", function test() {
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
          hull: "custom_date_created_at"
        }, {
          name: "custom_hubspot_create_at",
          hull: "custom_created_at"
        }]
      }
    };
    minihubspot.listen(8002);
    minihull.listen(8001).then(done);
  });

  it("should pass batch extract to hubspot batch endpoint", (done) => {
    minihubspot.stubApp("post", "/contacts/v1/contact/batch")
      .callsFake((req, res) => {
        res.status(202).end();
      });
    minihull.stubUsersBatch([{
      email: "foo@bar.com",
      first_name: "Foo",
      last_name: "Bar"
    }]);
    minihull.stubApp("/search/account_reports/bootstrap").respond({});
    minihull.batchUsersConnector(connector, "http://localhost:8000/batch").catch(err => console.log(err));
    minihubspot.on("incoming.request#3", (req) => {
      const lastReq = minihubspot.requests.get("incoming").last().value();
      expect(lastReq.url).to.be.eq("/contacts/v1/contact/batch/?auditId=Hull");
      expect(lastReq.body).to.be.an("array");
      expect(lastReq.body[0]).to.have.property("email");
      expect(lastReq.body[0]).to.have.property("properties");
      done();
    });
  });

  it("should handle errors and retry valid users", (done) => {
    minihubspot.stubApp("post", "/contacts/v1/contact/batch")
      .onFirstCall()
      .callsFake((req, res) => {
        res.status(500).json({
          status: "error",
          message: "Errors found processing batch update",
          invalidEmails: [minihull.users().get("0.email")],
          failureMessages: [{
            index: 0,
            error: {
              status: "error",
              message: `Email address ${minihull.users().get("0.email")} is invalid`
            }
          }, {
            index: 2,
            propertyValidationResult: {
              isValid: false,
              message: "1496643178000 is at 6:12:58.0 UTC, not midnight!",
              error: "INVALID_DATE",
              name: "clearbit_prospected_at"
            }
          }]
        });
      })
      .onSecondCall()
      .callsFake((req, res) => {
        res.status(202).end();
      });
    minihull.stubApp("/search/account_reports/bootstrap").respond({});
    minihull.stubUsersBatch([{
      email: "foo@bar.com",
      first_name: "Foo",
      last_name: "Bar"
    }, {
      email: "foo1@bar.com",
      first_name: "Foo1",
      last_name: "Bar1"
    }, {
      email: "foo2@bar.com",
      first_name: "Foo2",
      last_name: "Bar2"
    }]);
    minihubspot.on("incoming.request", (req) => console.log("MINIHUBSPOT", req.method, req.url));
    minihull.batchUsersConnector(connector, "http://localhost:8000/batch");
    minihubspot.on("incoming.request#3", (req) => {
      const lastReq = minihubspot.requests.get("incoming").last().value();
      expect(lastReq.url).to.be.equal("/contacts/v1/contact/batch/?auditId=Hull");
      expect(lastReq.body).to.be.an("array");
      expect(lastReq.body[0]).to.have.property("email");
      expect(lastReq.body[0]).to.have.property("properties");
      expect(lastReq.body.length).to.be.equal(3);
    });

    minihubspot.on("incoming.request#4", (req) => {
      const lastReq = minihubspot.requests.get("incoming").last().value();
      expect(lastReq.url).to.be.equal("/contacts/v1/contact/batch/?auditId=Hull");
      expect(lastReq.body).to.be.an("array");
      expect(lastReq.body[0]).to.have.property("email");
      expect(lastReq.body[0]).to.have.property("properties");
      expect(lastReq.body.length).to.be.equal(1);
      done();
    });
    minihubspot.on("incoming.request", (req) => {
      console.log(req.method, req.url);
    });
  });

  afterEach(() => {
    minihull.close();
    minihubspot.close();
    server.close();
  });
});
