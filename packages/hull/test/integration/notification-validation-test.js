/* global describe, it */
const { expect, should } = require("chai");
const sinon = require("sinon");
const express = require("express");
const Promise = require("bluebird");
const https = require("http");

const Hull = require("../../src");
const notificationHandler = require("../../src/handlers/notification-handler/factory");
// const smartNotifierMiddleware = require("../../src/utils/smart-notifier-middleware");
// const requestClient = require("request");

const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
const app = express();
const server = https.createServer(app);
const handler = sinon.stub().resolves(true);
const valid_notification = {
  notification_id: "0123456789",
  channel: "user:update",
  connector: {
    private_settings: {}
  },
  segments: [],
  accounts_segments: [],
  configuration: {
    id: "5c21c7a6b0c4ae18e1001123",
    secret: "1234",
    organization: "test.hullapp.io"
  },
  messages: []
};

let mockHttpClient = {};
const connector = new Hull.Connector({
  connectorName: "TestConnector",
  port: 9090,
  timeout: "100ms",
  hostSecret: "1234",
  clientConfig: {
    protocol: "http"
  },
  manifest: {},
  notificationValidatorHttpClient: mockHttpClient
});
connector.setupApp(app);
app.use(
  "/notify",
  notificationHandler({
    "user:update": handler
  }).router
);

connector.startApp(server);

describe("notificationHandler validation", () => {
  it("should fail with missing smart notifier header", done => {
    chai
      .request(server)
      .post("/notify")
      .send(valid_notification)
      // missing header: X-Hull-Smart-Notifier', 'true'
      .set("X-Hull-Smart-Notifier-Signature", "jwt_secret")
      .set("X-Hull-Smart-Notifier-Signature-Version", "v1")
      .set("X-Hull-Smart-Notifier-Signature-Public-Key-Url", "none")
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers["content-type"]).to.have.string("application/json");
        expect(res.body.error.code).to.be.equal("MISSING_FLAG_HEADER");
        done();
      });
  });

  it("should fail with unknown signature version", done => {
    chai
      .request(server)
      .post("/notify")
      .send(valid_notification)
      .set("X-Hull-Smart-Notifier", "true")
      .set("X-Hull-Smart-Notifier-Signature", "jwt_secret")
      .set("X-Hull-Smart-Notifier-Signature-Version", "unknown_version")
      .set("X-Hull-Smart-Notifier-Signature-Public-Key-Url", "none")
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers["content-type"]).to.have.string("application/json");
        expect(res.body.error.code).to.be.equal(
          "UNSUPPORTED_SIGNATURE_VERSION"
        );
        done();
      });
  });

  it("should cache the platform certificate", done => {
    console.log("TO BE IMPLEMENTED");
    done();
  });

  it("should fail with missing signature headers", done => {
    chai
      .request(server)
      .post("/notify")
      .send(valid_notification)
      .set("X-Hull-Smart-Notifier", "true")
      .set("X-Hull-Smart-Notifier-Signature-Version", "v1")
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers["content-type"]).to.have.string("application/json");
        expect(res.body.error.code).to.be.equal("MISSING_SIGNATURE_HEADERS");
        done();
      });
  });

  it("should fail with missing configuration", done => {
    let missing_configuration = {
      notification_id: "0123456789",
      channel: "user:update",
      messages: []
    };
    chai
      .request(server)
      .post("/notify")
      .send(missing_configuration)
      .set("X-Hull-Smart-Notifier", "true")
      .set("X-Hull-Smart-Notifier-Signature", "incorrect")
      .set("X-Hull-Smart-Notifier-Signature-Version", "v1")
      .set("X-Hull-Smart-Notifier-Signature-Public-Key-Url", "none")
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers["content-type"]).to.have.string("application/json");
        // expect(res.body.errors).to.be.an('array');
        // expect(res.body.errors).to.be.not.empty;
        // expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.error.code).to.be.equal("MISSING_CONFIGURATION");
        done();
      });
  });

  it("should fail with invalid signature headers", done => {
    mockHttpClient.post = function(url, body, cb) {
      cb(null, {}, "invalid certificate");
    };

    chai
      .request(server)
      .post("/notify")
      .send(valid_notification)
      .set("X-Hull-Smart-Notifier", "true")
      .set("X-Hull-Smart-Notifier-Signature", "incorrect")
      .set("X-Hull-Smart-Notifier-Signature-Version", "v1")
      .set("X-Hull-Smart-Notifier-Signature-Public-Key-Url", "http://wwww")
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.headers["content-type"]).to.have.string("application/json");
        expect(res.body.error.code).to.be.equal("INVALID_CERTIFICATE");
        done();
      });
  });
});
