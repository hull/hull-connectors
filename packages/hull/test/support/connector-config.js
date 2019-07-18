const sinon = require("sinon");
const handler = () => {};
const HullStub = require("./hull-stub");

const config = {
  manifest: {},
  hostSecret: 1234,
  devMode: false,
  port: 8080,
  handlers: {
    jobs: {
      handler
    },
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

module.exports = worker => {
  const useSpy = sinon.spy();
  const jobsSpy = sinon.spy();
  const processSpy = sinon.spy();
  class WorkerStub {
    use(...args) {
      return useSpy(...args);
    }

    setJobs(...args) {
      return jobsSpy(...args);
    }

    process(...args) {
      return processSpy(...args);
    }
  }
  return {
    spies: {
      useSpy,
      jobsSpy,
      processSpy
    },
    dependencies: {
      Worker: WorkerStub,
      Client: HullStub
    },
    config: {
      ...config,
      workerConfig: {
        start: worker
      }
    }
  };
};
