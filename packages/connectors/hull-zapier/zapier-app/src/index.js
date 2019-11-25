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
  const { status, content } = response;
  if (status >= 500) {
    throw new Error(content);
  }
  if (status >= 400) {
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
