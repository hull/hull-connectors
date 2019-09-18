const { ContextMock } = require("./helper/connector-mock");

const action = require("../../server/handlers/status-check");

describe("statusCheckAction", () => {
  test("should return status ok if connector is properly configured", () => {
    const private_settings = {
      api_key: "1234567abcd=",
      enabled: true,
      sending_enabled: true,
      synchronized_segments: ["madkudu enrich"]
    };

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-madkudu.herokuapp.com/status/",
      hull: ctx
    };

    action(req, responseMock);
    expect(jsonMock.mock.calls[0][0]).toEqual({ status: "ok", messages: [] });
  });

  test("should return status warning if connector is disabled", () => {
    const private_settings = {
      api_key: "1234567abcd=",
      enabled: false,
      sending_enabled: true,
      synchronized_segments: ["madkudu enrich"]
    };

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-madkudu.herokuapp.com/status/",
      hull: ctx
    };

    action(req, responseMock);
    expect(jsonMock.mock.calls[0][0]).toEqual({ status: "warning", messages: ["Connector is not enabled, no accounts will be sent to Madkudu. Go to Settings to enable the connector."] });
  });

  test("should return status error if no API key is present", () => {
    const private_settings = {
      api_key: null,
      enabled: true,
      sending_enabled: true,
      synchronized_segments: ["madkudu enrich"]
    };

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-madkudu.herokuapp.com/status/",
      hull: ctx
    };

    action(req, responseMock);
    expect(jsonMock.mock.calls[0][0]).toEqual({ status: "error", messages: ["Missing Credentials: API key is not configured in Settings."] });
  });

  test("should return status error if no API key is present and connector is disabled", () => {
    const private_settings = {
      api_key: null,
      enabled: false,
      sending_enabled: true,
      synchronized_segments: ["madkudu enrich"]
    };

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation((data) => {
      console.log("response.json mocked function called with:", data);
    });
    responseMock.json = jsonMock.bind(responseMock);

    const ctx = new ContextMock("1234", {}, private_settings);
    const req = {
      url: "https://hull-madkudu.herokuapp.com/status/",
      hull: ctx
    };

    action(req, responseMock);
    expect(jsonMock.mock.calls[0][0]).toEqual({ status: "error", messages: ["Connector is not enabled, no accounts will be sent to Madkudu. Go to Settings to enable the connector.", "Missing Credentials: API key is not configured in Settings."] });
  });

  test("should return status 404 if no hull object is present in the request", () => {
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
      url: "https://hull-madkudu.herokuapp.com/status/",
      hull: {
        ship: { }
      }
    };

    action(req, responseMock);
    expect(statusMock.mock.calls[0][0]).toBe(404);
    expect(jsonMock.mock.calls[0][0]).toEqual({ status: 404, messages: ["Connector not found"] });
  });
});
