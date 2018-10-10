/* global describe, it */
const Hull = require("hull");
const express = require("express");
const nock = require("nock");
const request = require("request");
const cheerio = require("cheerio");
const ClientMock = require("./support/client-mock");
const server = require("../../server/server");

const assert = require("assert");

const port = 8070;
const app = express();

process.env.CLIENT_ID = 1234;
const connector = new Hull.Connector({ port, hostSecret: "123" });

connector.setupApp(app);
const typeform_uid = "54321";
app.use((req, res, next) => {
  req.hull.client = ClientMock();
  req.hull.ship = {
    private_settings: {
      api_key: "12345",
      typeform_uid
    }
  };

  next();
});

connector.startApp(server(app));

const typeformAllFormsMock = nock("https://api.typeform.com")
  .get("/forms")
  .query(true)
  .reply(200, [
    {
      name: "name1",
      id: "123"
    },
    {
      name: "name2",
      id: 124
    }
  ]);

const typeformSingleFormMock = nock("https://api.typeform.com")
  .get(`/forms/${typeform_uid}`)
  .query(true)
  .reply(200, {
    stats: {
      responses: {
        completed: 12
      }
    }
  });

describe("Server", () => {
  describe("for /schema/typeforms", () => {
    it("should connect with typeform API and return status OK.", (done) => {
      request
        .get(`http://127.0.0.1:${port}/schema/forms`)
        .on("response", (response) => {
          assert(response.statusCode === 200);
          typeformAllFormsMock.done();
          done();
        });
    });
  });

  describe("for /admin", () => {
    it("should connect with typeform API and return status OK with rendered admin.html file", (done) => {
      let body;

      request
        .get(`http://127.0.0.1:${port}/admin`)
        .on("response", (response) => {
          assert(response.statusCode === 200);
          typeformSingleFormMock.done();
        })
        .on("data", (data) => {
          body += data;
        });

      setTimeout(() => {
        const $ = cheerio.load(body);
        assert(
          $(
            $(".text-center")
              .children()
              .get(1)
          )
            .text()
            .includes("Completed Form Submissions: 12")
        );
        done();
      }, 100);
    });
  });
});
