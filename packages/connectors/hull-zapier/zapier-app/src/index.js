const _ = require("lodash");
const platformVersion = require("zapier-platform-core").version;
const authentication = require("./authentication");
const triggers = require("./triggers");
const version = require("../package.json").version;

const searches = require("./searches");
const creates = require("./creates");
const resources = {};

const includeApiKey = (request, z, bundle) => {
  if (bundle.authData.token) {
    request.url = `${request.url}?token=${bundle.authData.token}`;
  }
  return request;
};

const parseResponse = (response, z, _bundle) => {
  const { status, content, request } = response;

  if (status >= 500) {
    throw new Error(content);
  }
  if (status >= 400) {
    throw new z.errors.HaltedError(content);
  }

  const { error } = response.json;
  if (!_.isNil(error) && error === true) {

    // TODO: terrible - do not leave this in
    if (!_.isNil(request) && _.includes(request.url, "/search?")) {
      throw new z.errors.HaltedError("Unable to find entity in Hull.");
    }
    if (!_.isNil(request) && _.includes(request.url, "/auth?")) {
      throw new z.errors.HaltedError("The access token for your Hull organization appears to be invalid. Please ensure that you have copied the token from your Zapier Connector settings page in your Hull organization.");
    }
    throw new z.errors.HaltedError(content);
  }
  response.json = z.JSON.parse(content);
  return response;
};

const App = {
  version,

  platformVersion,

  authentication,

  beforeRequest: [includeApiKey],

  afterResponse: [parseResponse],

  resources,

  triggers,

  searches,

  creates
};

module.exports = App;
