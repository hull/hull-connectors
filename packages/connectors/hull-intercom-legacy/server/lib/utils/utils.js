const _ = require("lodash");

const jsonifyArrays = obj => {
  _.forEach(_.keys(obj), key => {
    const value = obj[key];
    if (Array.isArray(value)) {
      obj[key] = JSON.stringify(obj[key]);
    } else if (_.isPlainObject(obj[key])) {
      return jsonifyArrays(obj[key]);
    }
    return obj[key];
  });
  return obj;
};

module.exports = {
  jsonifyArrays
};
