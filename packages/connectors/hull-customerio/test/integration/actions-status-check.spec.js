const { ContextMock } = require("./helper/connector-mock");

const action = require("../../server/actions/status");
const nock = require("nock");

describe("actions-status-check", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test("should return status ok if connector is properly configured", function (done) { // eslint-disable-line func-names
    const private_settings = {
      api_key: "1234567abcd=",
      site_id: "site12345",
      synchronized_segments: ["cio leads"]
    };

    const req = new ContextMock("1234", {}, private_settings);
    req.url = "https://hull-customerio.herokuapp.com/status/";

    nock("https://track.customer.io", {
      reqheaders: {
        authorization: "Basic c2l0ZTEyMzQ1OjEyMzQ1NjdhYmNkPQ=="
      }
    })
      .get("/auth")
      .reply(200, {
        meta: {
          message: "nice credentials."
        }
      });
    action(req).then((status) => {
      expect(status).toEqual({ status: "ok", messages: [] });
      expect(nock.isDone()).toBe(true);
      done();
    });
  });

  test("should set status to check Site ID and API Key if authentication returns status 401", function (done) { // eslint-disable-line func-names
    const private_settings = {
      api_key: "bar",
      site_id: "foo",
      synchronized_segments: ["cio leads"]
    };

    const req = new ContextMock("1234", {}, private_settings);
    req.url = "https://hull-customerio.herokuapp.com/status/";

    nock("https://track.customer.io", {
      reqheaders: {
        authorization: "Basic Zm9vOmJhcg=="
      }
    })
      .get("/auth")
      .reply(401, {
        meta: {
          error: "Unauthorized request"
        }
      });
    action(req).then((status) => {
      expect(status).toEqual({ status: "error", messages: ["Invalid Credentials: Verify Site ID and API Key in Settings."] });
      expect(nock.isDone()).toBe(true);
      done();
    });
  });

  test("should indicate problems if authentication returns status 500", function (done) { // eslint-disable-line func-names
    const private_settings = {
      api_key: "bar",
      site_id: "foo",
      synchronized_segments: ["cio leads"]
    };

    const req = new ContextMock("1234", {}, private_settings);
    req.url = "https://hull-customerio.herokuapp.com/status/";

    nock("https://track.customer.io", {
      reqheaders: {
        authorization: "Basic Zm9vOmJhcg=="
      }
    })
      .get("/auth")
      .reply(500, {
        meta: {
          error: "Some weird error"
        }
      });
    action(req).then((status) => {
      expect(status).toEqual({ status: "error", messages: ["Error when trying to connect with Customer.io: Internal Server Error"] });
      expect(nock.isDone()).toBe(true);
      done();
    });
  });

  test("should return a warning if no whitelisted segments are configured in the settings", function (done) { // eslint-disable-line func-names
    const private_settings = {
      api_key: "1234567abcd=",
      site_id: "site12345",
      synchronized_segments: []
    };

    const req = new ContextMock("1234", {}, private_settings);
    req.url = "https://hull-customerio.herokuapp.com/status/";

    nock("https://track.customer.io", {
      reqheaders: {
        authorization: "Basic c2l0ZTEyMzQ1OjEyMzQ1NjdhYmNkPQ=="
      }
    })
      .get("/auth")
      .reply(200, {
        meta: {
          message: "nice credentials."
        }
      });
    action(req).then((status) => {
      expect(status).toEqual({ status: "warning", messages: ["No users will be synchronized because you have not specified at least one whitelisted segment in Settings."] });
      expect(nock.isDone()).toBe(true);
      done();
    });
  });

  test("should return a setupRequired if authentication is not configured in the settings", function (done) { // eslint-disable-line func-names
    const private_settings = {
      synchronized_segments: ["cio leads"],
    };

    const req = new ContextMock("1234", {}, private_settings);
    req.url = "https://hull-customerio.herokuapp.com/status/";

    action(req).then((status) => {
      expect(status).toEqual({ status: "setupRequired", messages: ["Please enter your Customer.io Site ID and API Key"] });
      done();
    });
  });

  test("should return an error if Site ID is not configured in the settings", function (done) { // eslint-disable-line func-names
    const private_settings = {
      api_key: "bar",
      synchronized_segments: ["cio leads"]
    };

    const req = new ContextMock("1234", {}, private_settings);
    req.url = "https://hull-customerio.herokuapp.com/status/";

    action(req).then((status) => {
      expect(status).toEqual({ status: "setupRequired", messages: ["Please enter your Customer.io Site ID and API Key"] });
      done();
    });
  });

  test("should return an error if API Key is not configured in the settings", function (done) { // eslint-disable-line func-names
    const private_settings = {
      site_id: "foo",
      synchronized_segments: ["cio leads"]
    };

    const req = new ContextMock("1234", {}, private_settings);
    req.url = "https://hull-customerio.herokuapp.com/status/";

    action(req).then((status) => {
      expect(status).toEqual({ status: "setupRequired", messages: ["Please enter your Customer.io Site ID and API Key"] });
      done();
    });
  });
});
