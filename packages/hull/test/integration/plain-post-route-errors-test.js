/* global it, describe, beforeEach, afterEach */
const express = require("express");
const superagent = require("superagent");
const bluebirdPromise = require("bluebird");
const MiniHull = require("minihull");
const sinon = require("sinon");
const { expect } = require("chai");

const { ConfigurationError, TransientError } = require("../../src/errors");
const notificationHandler = require("../../src/handlers/notification-handler/factory");
const Hull = require("../../src");

/*
 * This is the main integration test show how connector should respond in case of different errors
 */
describe("plain post routes", () => {
  // this agent accepts every response no matter what is the status code
  // const agent = superagent.agent()
  //     .ok(() => true);
  let connector;
  let app;
  let server;
  let miniHull;
  let connectorId;
  let stopMiddleware;
  let startMiddleware;
  let getMetric;

  beforeEach(async () => {
    miniHull = new MiniHull();
    connectorId = miniHull.fakeId();
    miniHull.stubConnector({
      id: connectorId,
      private_settings: {
        enrich_segments: ["1"]
      }
    });
    stopMiddleware = sinon.spy((err, req, res, next) => next(err))
    startMiddleware = sinon.spy((err, req, res, next) => next(err))
    getMetric = sinon.spy((err, req, res, next) => next(err))
    connector = new Hull.Connector({
      port: 9091,
      timeout: "100ms",
      skipSignatureValidation: true,
      hostSecret: "1234",
      clientConfig: {
        protocol: "http"
      },
      instrumentation: {
        startMiddleware: () => startMiddleware,
        stopMiddleware: () => stopMiddleware,
        getMetric: () => getMetric,
      },
      middlewares: [],
      manifest: {
        incoming: [
          {
            url: "/errorEndpoint",
            handler: "errorEndpoint",
            options: {
              respondWithError: false
            }
          },
          {
            url: "/transientErrorEndpoint",
            handler: "transientErrorEndpoint",
            options: {
              respondWithError: false
            }
          },
          {
            url: "/configurationErrorEndpoint",
            handler: "configurationErrorEndpoint",
            options: {
              respondWithError: false
            }
          },
          {
            url: "/timeoutErrorEndpoint",
            handler: "timeoutErrorEndpoint",
            options: {
              respondWithError: false
            }
          }
        ]
      },
      handlers: () => ({
        incoming: {
          errorEndpoint: () => {
            throw new Error();
          },
          transientErrorEndpoint: () => {
            throw new TransientError();
          },
          configurationErrorEndpoint: () => {
            throw new ConfigurationError("Missing API Key");
          },
          timeoutErrorEndpoint: () => {
            setTimeout(() => {
              res.json({ foo: "bar" });
            }, 125);
          }
        }
      })
    })
    await connector.start();
    await miniHull.listen(3000);
    return true
  });

  afterEach(() => {
    connector.stop();
    miniHull.server.close();
  });

  it("should handle unhandled error", async () => {
    return miniHull
      .postConnector(connectorId, "localhost:9091/errorEndpoint")
      .catch(err => {
        console.log("++++++++++++");
        console.log(err.response.text);
        console.log("++++++++++++");
        expect(stopMiddleware.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.text).to.equal("unhandled-error");
      });
  });
  it("transient error", () => {
    return miniHull.postConnector(connectorId, "localhost:9091/transientErrorEndpoint")
      .catch((err) => {
        expect(stopMiddleware.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.text).to.equal("unhandled-error");
      });
  });
  it("configuration error", () => {
    return miniHull.postConnector(connectorId, "localhost:9091/configurationErrorEndpoint")
      .catch((err) => {
        expect(stopMiddleware.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.text).to.equal("unhandled-error");
      });
  });
  it("should handle timeout error", function test(done) {
    miniHull.postConnector(connectorId, "localhost:9091/timeoutErrorEndpoint")
      .catch((err) => {
        expect(stopMiddleware.called).to.be.true;
        expect(err.response.statusCode).to.equal(500);
        expect(err.response.text).to.equal("unhandled-error");
      });
    setTimeout(() => {
      done();
    }, 150);
  });
});
