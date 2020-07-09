// @flow

function wrap(methodName) {
  return function callService(...args) {
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
