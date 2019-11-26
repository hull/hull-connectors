import getRouter from "hull/src/handlers/get-router";

const Promise = require("bluebird");
const Supply = require("supply");
const httpMocks = require("node-mocks-http");

async function getHullContext({ credentials, middlewares }) {
  const supply = new Supply();

  const { router } = getRouter({
    method: "GET",
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      cacheContextFetch: false,
      respondWithError: true,
      strict: false
    },
    requestName: "action",
    handler: (req, res, next) => {
      next();
    }
  });

  const request = httpMocks.createRequest({
    method: "POST",
    url: "/"
  });
  request.query = credentials;
  supply.use(middlewares);
  supply.use(router);
  await Promise.fromCallback(callback =>
    supply.each(
      request,
      {
        json: () => {},
        setHeader: () => {}
      },
      callback
    )
  );
  return request.hull;
}

module.exports = getHullContext;
