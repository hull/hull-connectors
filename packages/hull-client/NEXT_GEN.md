# Next Gen

```javascript
// server/server.js
const { notificationHandler, schedulerHandler, actionHandler, batcherHandler } = require("hull/lib/utils");

function server(app, connector): Application {
  const notifications = notificationHandler({
    "user:update": {
      callback: (ctx, messages) => {},
      options: {
        defaultFlowControl: {
          size: 10,
          in: 10
          in_time: 10
        }
      }  
    },
    "account:update"
  }, {

  })
  app.use("/smart-notifier", notifications);
  app.use("/batch", notifications);
  app.use("/batch-accounts", notifications);

  app.use("/fetch-users", queueHandler("fetchUsers"));

  app.use("/status", schedulerHandler((ctx) => {

  }));

  app.use("/import-all-users", actionHandler((ctx) => {

  }));

  app.use("/incoming-webhook", (req, res, next) => {
    // custom middleware
    next();
  }, batcherHandler((ctx, requests) => {

  }));

  app.use("/admin", oauthHandler({
    
  }));

  return app;
}

module.exports = server;
```

```javascript
function worker(connector) {
  return connector.worker({
    fetchUsers: (ctx) => {

    }
  }).use(appMiddleware());
}
```

```javascript
// runner.js
const app = express();
const connector = Hull.Connector({ ...settings });

connector.setupApp(app);
// req.hull.hostname
// req.hull.options
// req.hull.token
// req.hull.config
// req.hull.connectorConfig
// req.hull.cache
// req.hull.metric
// req.hull.enqueue
//  
server(app);

connector.startApp(app);
// last chance error handling

```
