const handler = () => {};
const HullStub = require("./hull-stub");

class WorkerStub {
  use() {}
  setJobs() {}
  process() {}
}

const dependencies = {
  Worker: WorkerStub,
  Client: HullStub
};

const config = {
  manifest: {},
  hostSecret: 1234,
  devMode: false,
  port: 8080,
  handlers: {
    statuses: { handler },
    subscriptions: {
      handler
    },
    json: {
      handler
    },
    tabs: {
      handler
    },
    private_settings: {
      handler
    }
  },
  middlewares: [],
  cacheConfig: {
    store: "memory",
    ttl: 1
  },
  logsConfig: {
    logLevel: "debug"
  },
  clientConfig: {},
  serverConfig: {
    start: true
  }
};

module.exports.config = config;
module.exports.dependencies = dependencies;
