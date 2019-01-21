const { ContextMock } = require("./helper/connector-mock");

const action = require("../../server/actions/status-check");
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

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-customerio.herokuapp.com/status/",
      hull: ctx
    };

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
    action(req, responseMock).then(() => {
      expect(jsonMock.mock.calls[0][0]).toEqual({ status: "ok", messages: [] });
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

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-customerio.herokuapp.com/status/",
      hull: ctx
    };

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
    action(req, responseMock).then(() => {
      expect(jsonMock.mock.calls[0][0]).toEqual({ status: "error", messages: ["Invalid Credentials: Verify Site ID and API Key in Settings."] });
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

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-customerio.herokuapp.com/status/",
      hull: ctx
    };

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
    action(req, responseMock).then(() => {
      expect(jsonMock.mock.calls[0][0]).toEqual({ status: "error", messages: ["Error when trying to connect with Customer.io: Internal Server Error"] });
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

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-customerio.herokuapp.com/status/",
      hull: ctx
    };

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
    action(req, responseMock).then(() => {
      expect(jsonMock.mock.calls[0][0]).toEqual({ status: "warning", messages: ["No users will be synchronized because you have not specified at least one whitelisted segment in Settings."] });
      expect(nock.isDone()).toBe(true);
      done();
    });
  });

  test("should return an error if authentication is not configured in the settings", function (done) { // eslint-disable-line func-names
    const private_settings = {
      synchronized_segments: ["cio leads"]
    };

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-customerio.herokuapp.com/status/",
      hull: ctx
    };

    action(req, responseMock).then(() => {
      expect(jsonMock.mock.calls[0][0]).toEqual({ status: "error", messages: ["Missing Credentials: Site ID or API Key are not configured in Settings."] });
      done();
    });
  });

  test("should return an error if Site ID is not configured in the settings", function (done) { // eslint-disable-line func-names
    const private_settings = {
      api_key: "bar",
      synchronized_segments: ["cio leads"]
    };

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-customerio.herokuapp.com/status/",
      hull: ctx
    };

    action(req, responseMock).then(() => {
      expect(jsonMock.mock.calls[0][0]).toEqual({ status: "error", messages: ["Missing Credentials: Site ID or API Key are not configured in Settings."] });
      done();
    });
  });

  test("should return an error if API Key is not configured in the settings", function (done) { // eslint-disable-line func-names
    const private_settings = {
      site_id: "foo",
      synchronized_segments: ["cio leads"]
    };

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-customerio.herokuapp.com/status/",
      hull: ctx
    };

    action(req, responseMock).then(() => {
      expect(jsonMock.mock.calls[0][0]).toEqual({ status: "error", messages: ["Missing Credentials: Site ID or API Key are not configured in Settings."] });
      done();
    });
  });

  test("should return status 404 if no hull object is present in the request", function (done) { // eslint-disable-line func-names
    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.status.json mocked function called with:", data);
    });
    const statusMockReturn = {};
    statusMockReturn.json = jsonMock.bind(statusMockReturn);
    const statusMock = jest.fn().mockImplementation(() => {
      console.log("response.status mocked function called");
      return statusMockReturn;
    });
    responseMock.status = statusMock.bind(responseMock);

    const req = {
      url: "https://hull-customerio.herokuapp.com/status/",
      hull: {
        ship: { }
      }
    };

    action(req, responseMock).then(() => {
      expect(statusMock.mock.calls[0][0]).toBe(404);
      expect(jsonMock.mock.calls[0][0]).toEqual({ status: 404, messages: ["Connector not found"] });
      done();
    }, (err) => {
      console.error(err);
    });
  });
});
