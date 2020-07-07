// @flow

function wrap(methodName) {
  // let counter = 0;
  return (...args) => {
    // counter += 1;
    return new Promise((resolve, reject) =>
      window.google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [methodName].apply(window.google.script.run, args)
    );
  };
}

const Service = window.GoogleServiceMock || {};

if (window.google && window.google.script) {
  Object.keys(window.google.script.run).forEach(k => {
    Service[k] = wrap(k);
  });
}

export default Service;
