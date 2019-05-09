// // @flow
// import { Strategy as SlackStrategy } from "passport-slack";
// import {
//   notifHandler,
//   smartNotifierHandler,
//   oAuthHandler,
// } from "hull/lib/utils";
// import updateUser from "./update-user";
// import BotFactory from "./bot-factory";
// import statusHandler from "./status";
// import setupWebserver from "./setup-webserver";
// import type { HullContext, ServerOptions } from "./types";
//
// module.exports = function Server({
//   port,
//   hostSecret,
//   clientID,
//   clientSecret,
//   Hull,
//   devMode,
// }: ServerOptions) {
//   const { Middleware } = Hull;
//   const { controller, connectSlack, getBot } = BotFactory({
//     port,
//     hostSecret,
//     clientID,
//     clientSecret,
//     Hull,
//     devMode,
//   });
//
//   setupWebserver(controller, port, (err, app) => {
//     const connector = new Hull.Connector({ port, hostSecret });
//
//     // connector.setupApp(app);
//     controller.createWebhookEndpoints(app);
//     // connector.startApp(app);
//
//     // app.all("/status", statusHandler);
//
//     app.get(
//       "/connect",
//       (req, res, next) => {
//         req.hull = { ...req.hull, token: req.query.token };
//         next();
//       },
//
//       Middleware({ hostSecret, fetchShip: true, cacheShip: true }),
//
//       (req, res) => {
//         connectSlack({ hull: req.hull.client, ship: req.hull.ship });
//         setTimeout(() => {
//           res.redirect(req.header("Referer"));
//         }, 2000);
//       }
//     );
//
//     app.use(connector.instrumentation.stopMiddleware());
//
//     return app;
//   });
// };
