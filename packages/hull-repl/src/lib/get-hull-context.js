const Promise = require("bluebird");
const Hull = require("hull");
const Supply = require("supply");
const httpMocks = require("node-mocks-http");
const { contextBaseMiddleware } = require("hull/src/middlewares");
const { credsFromQueryMiddlewares } = require("hull/src/utils");

async function getHullContext(credentials) {
  const connector = new Hull.Connector({
    hostSecret: "hull-repl"
  });
  const supply = new Supply();
  const query = {
    ship: credentials.ship,
    secret: credentials.secret,
    organization: credentials.organization
  };
  const request = httpMocks.createRequest({
    method: "POST",
    url: "/"
  });
  request.query = query;
  supply.use(
    contextBaseMiddleware({
      instrumentation: connector.instrumentation,
      queue: connector.queue,
      cache: connector.cache,
      connectorConfig: connector.connectorConfig,
      clientConfig: connector.clientConfig
    })
  );
  credsFromQueryMiddlewares().forEach(middleware => supply.use(middleware));
  await Promise.fromCallback(callback => {
    supply.each(request, {}, callback);
  });
  return request.hull;
}

module.exports = getHullContext;
