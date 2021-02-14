import connect from "connect";
import _ from "lodash";
import bodyParser from "body-parser";

function noop() {}

function camelize(str) {
  const ret = str.replace(/[-_\s]+(.)?/g, (match, c) => (c ? c.toUpperCase() : ""));
  return ret.charAt(0).toLowerCase() + ret.slice(1);
}

/*
  Parses current request from Segment. Stores the token from req.headers into req.hull.token
*/
function authTokenMiddleware(req, res, next) {
  req.hull = req.hull || {};
  if (req.headers.authorization) {
    const [authType, token64] = req.headers.authorization.split(" ");
    if (authType === "Basic" && token64) {
      try {
        req.hull.token = new Buffer(token64, "base64").toString().split(":")[0].trim();
        req.hull.config = false;
      } catch (err) {
        const e = new Error("Invalid Basic Auth Header");
        e.status = 401;
        return next(e);
      }
    }
  }
  return next();
}

/*
  Parses current request from Segment. Stores the message in req.segment.message;
*/
function parseRequest(req, res, next) {
  req.segment = req.segment || {};

  req.segment.body = req.body;
  req.segment.message = req.body;
  return next();
}

function processHandlers(handlers, { Hull, onMetric }) {
  return function processMiddleware(req, res, next) {
    if (!req.hull || !req.hull.client || !req.hull.ship) {
      const e = new Error("Missing Credentials");
      e.status = 400;
      return next(e);
    }

    try {
      const { client: hull, ship } = req.hull;
      const { message } = req.segment;

      const metric = (metricName, value) => onMetric(metricName, value, ship || {});

      const eventName = message.type;
      const eventHandlers = handlers[eventName];

      if (hull) {
        hull.logger.debug(`incoming.${eventName}.start`, { message });
      } else {
        Hull.logger.debug(`incoming.${eventName}.start`, { message });
      }

      metric(`request.${eventName}`, 1);

      if (eventHandlers && eventHandlers.length > 0) {
        if (message && message.integrations && message.integrations.Hull === false) {
          return next();
        }

        Object.keys(message).map((k) => {
          const camelK = camelize(k);
          message[camelK] = message[camelK] || message[k];
          return k;
        });


        const processors = eventHandlers.map(fn => fn(message, { ship, hull, metric }));

        Promise.all(processors).then(() => {
          next();
        }, (err = {}) => {
          // fix https://sentry.io/hull-dev/hull-segment/issues/415436300/
          if (_.isString(err)) return next({ status: 500, message: err });
          err.status = (err && err.status) || 500;
          return next(err);
        });
      } else {
        const e = new Error("Not Supported");
        e.status = 501;
        return next(e);
      }
      return next();
    } catch (err) {
      err.status = err.status || 500;
      return next(err);
    }
  };
}


module.exports = function SegmentHandler(options = {}) {
  const app = connect();
  const { Hull, clientMiddleware, handlers = [], onMetric = noop } = options;

  const _handlers = {};
  const _flushers = [];


  _.map(handlers, (fn, event) => {
    _handlers[event] = _handlers[event] || [];
    _handlers[event].push(fn);
    if (typeof fn.flush === "function") {
      _flushers.push(fn.flush);
    }
    return this;
  });

  app.use((req, res, next) => {
    bodyParser.json()(req, res, () => {
      next();
    });
  });
  app.use(parseRequest); // parse segment request, early return if invalid.
  app.use(authTokenMiddleware); // retreives Hull config and stores it in the right place.
  app.use(clientMiddleware);
  app.use(processHandlers(_handlers, { Hull, onMetric }));
  app.use((req, res) => {
    res.json({ message: "thanks" });
  });
  app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
    if (err) {
      const data = {
        status: err.status,
        segmentBody: req.segment,
        method: req.method,
        headers: req.headers,
        url: req.url,
        params: req.params
      };
      if (err.status === 500) {
        data.stack = err.stack;
      }
      Hull.logger.debug(err.message, data);
    }
    /*
      this is there just to make eslint not thow an error
      we don't use next() but we need it in the params list
      because express detects a middleware with 4 args as an error callback
    */
    return res.status(err.status || 500).send({ message: err.message });
  });

  function handler(req, res) {
    return app.handle(req, res);
  }

  handler.exit = () => {
    return Promise.all(_flushers.map(fn => fn()));
  };

  return handler;
};
