const { post } = require("./request");
const { segmentsUrl, schemaUrl } = require("../config");

const getEntityAttributes = async (z, entityType) => {
  return post(z, {
    url: schemaUrl,
    body: {
      entityType
    }
  });
};

const getEntitySegments = async (z, entityType) => {
  return post(z, {
    url: segmentsUrl,
    body: {
      entityType
    }
  });
};

module.exports = {
  getEntityAttributes,
  getEntitySegments
};
