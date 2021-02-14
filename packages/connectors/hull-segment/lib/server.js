"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _jwtSimple = _interopRequireDefault(require("jwt-simple"));

var _utils = require("hull/lib/utils");

var _devMode = _interopRequireDefault(require("./dev-mode"));

var _handler = _interopRequireDefault(require("./handler"));

var _events = _interopRequireDefault(require("./events"));

var _analyticsClient = _interopRequireDefault(require("./analytics-client"));

var _updateUser = _interopRequireDefault(require("./update-user"));

var _status = _interopRequireDefault(require("./status"));

module.exports = function server(app, options = {}) {
  const Hull = options.Hull,
        hostSecret = options.hostSecret,
        onMetric = options.onMetric,
        clientMiddleware = options.clientMiddleware;

  if (options.devMode) {
    app.use((0, _devMode.default)());
  }

  app.get("/admin.html", clientMiddleware, (req, res) => {
    const config = req.hull.config;

    const apiKey = _jwtSimple.default.encode(config, hostSecret);

    const encoded = new Buffer(apiKey).toString("base64");
    const hostname = req.hostname;
    res.render("admin.html", {
      apiKey,
      encoded,
      hostname
    });
  });
  const analyticsClient = (0, _analyticsClient.default)();

  function handlerFactory(ignoreFilters = false) {
    return (0, _utils.notifHandler)({
      userHandlerOptions: {
        groupTraits: false,
        maxSize: parseInt(process.env.MAX_SIZE, 10) || 100,
        maxTime: parseInt(process.env.MAX_TIME, 10) || 1000
      },
      handlers: {
        "user:update": (ctx, messages = []) => {
          return Promise.all(messages.map(message => (0, _updateUser.default)(analyticsClient)({
            message
          }, {
            ship: ctx.ship,
            hull: ctx.client,
            ignoreFilters
          })));
        }
      }
    });
  }

  app.post("/notify", handlerFactory());
  app.post("/smart-notify", (0, _utils.smartNotifierHandler)({
    userHandlerOptions: {
      groupTraits: false
    },
    handlers: {
      "user:update": (ctx, messages = []) => {
        if (ctx && ctx.smartNotifierResponse && ctx.smartNotifierResponse.setFlowControl) {
          ctx.smartNotifierResponse.setFlowControl({
            type: "next",
            size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100,
            in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 1
          });
        }

        return Promise.all(messages.map(message => (0, _updateUser.default)(analyticsClient)({
          message
        }, {
          ship: ctx.ship,
          hull: ctx.client
        })));
      }
    }
  }));
  app.post("/batch", handlerFactory(true));
  const segment = (0, _handler.default)({
    onError(err) {
      console.warn("Error handling segment event", err, err && err.stack);
    },

    onMetric,
    clientMiddleware,
    Hull,
    handlers: _events.default
  });
  app.post("/segment", segment);
  app.all("/status", _status.default); // Error Handler

  app.use((err, req, res, next) => {
    // eslint-disable-line no-unused-vars
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
      }); // console.log(err.stack);
    }

    return res.status(err.status || 500).send({
      message: err.message
    });
  });

  app.exit = () => segment.exit();

  return app;
};