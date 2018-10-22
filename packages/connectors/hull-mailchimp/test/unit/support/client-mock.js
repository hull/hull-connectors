module.exports = function getClientMock(private_settings) {
  return {
    configuration: () => private_settings,
    logger: {
      info: (msg, data) => console.log(msg, data),
      error: (msg, data) => console.log(msg, data),
      debug: (msg, data) => console.log(msg, data),
      log: (msg, data) => console.log(msg, data)
    },
    get: () => {
      return Promise.resolve({});
    },
    post: () => {
      return Promise.resolve({});
    },
    put: () => {
      return Promise.resolve({});
    },
    utils: {
      extract: {
        handle: ({ body, batchSize, handler }) => {
          return Promise.resolve([handler([
            { id: "test", name: "test", segment_ids: [1, 123] }
          ])]);
        }
      }
    },
    asUser() {
      return {
        logger: {
          info: () => {}
        }
      };
    }
  };
};
