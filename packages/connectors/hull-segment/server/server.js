import jwt from "jwt-simple";
import { notifHandler, smartNotifierHandler } from "hull/lib/utils";

import devMode from "./dev-mode";
import SegmentHandler from "./handler";
import handlers from "./events";

import analyticsClientFactory from "./analytics-client";
import updateUser from "./update-user";
import statusHandler from "./status";

module.exports = function server(app, options = {}) {
  const { Hull, hostSecret, onMetric, clientMiddleware } = options;

  if (options.devMode) {
    app.use(devMode());
  }

  app.get("/admin.html", clientMiddleware, (req, res) => {
    const { config } = req.hull;
    const apiKey = jwt.encode(config, hostSecret);
    const encoded = new Buffer(apiKey).toString("base64");
    const hostname = req.hostname;
    res.render("admin.html", {
      apiKey,
      encoded,
      hostname
    });
  });

  const analyticsClient = analyticsClientFactory();

  function handlerFactory(ignoreFilters = false) {
    return notifHandler({
      userHandlerOptions: {
        groupTraits: false,
        maxSize: parseInt(process.env.MAX_SIZE, 10) || 100,
        maxTime: parseInt(process.env.MAX_TIME, 10) || 1000
      },
      handlers: {
        "user:update": (ctx, messages = []) => {
          return Promise.all(
            messages.map(message =>
              updateUser(analyticsClient)(
                {
                  message
                },
                {
                  ship: ctx.ship,
                  hull: ctx.client,
                  ignoreFilters
                }
              )
            )
          );
        }
      }
    });
  }

  app.post("/notify", handlerFactory());
  app.post(
    "/smart-notify",
    smartNotifierHandler({
      userHandlerOptions: {
        groupTraits: false
      },
      handlers: {
        "user:update": (ctx, messages = []) => {
          if (
            ctx &&
            ctx.smartNotifierResponse &&
            ctx.smartNotifierResponse.setFlowControl
          ) {
            ctx.smartNotifierResponse.setFlowControl({
              type: "next",
              size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100,
              in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 1
            });
          }
          return Promise.all(
            messages.map(message =>
              updateUser(analyticsClient)(
                {
                  message
                },
                {
                  ship: ctx.ship,
                  hull: ctx.client
                }
              )
            )
          );
        }
      }
    })
  );
  app.post("/batch", handlerFactory(true));

  const segment = SegmentHandler({
    onError(err) {
      console.warn("Error handling segment event", err, err && err.stack);
    },
    onMetric,
    clientMiddleware,
    Hull,
    handlers
  });

  app.post("/segment", segment);
  app.all("/status", statusHandler);

  // Error Handler
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err) {
      const data = {
        status: err.status,
        segmentBody: req.segment,
        method: req.method,
        headers: req.headers,
        url: req.url,
        params: req.params
      };
      console.log("Error ----------------", {
        message: err.message,
        status: err.status,
        data
      });
      // console.log(err.stack);
    }

    return res.status(err.status || 500).send({
      message: err.message
    });
  });

  app.exit = () => segment.exit();

  return app;
};
