// require("dotenv").config();
const url = process.env.CONNECTOR_URL;

const authUrl = `${url}/auth`;
const createUrl = `${url}/create`;
const schemaUrl = `${url}/schema`;
const segmentsUrl = `${url}/segments`;
const searchUrl = `${url}/search`;
const subscribeUrl = `${url}/subscribe`;
const unsubscribeUrl = `${url}/unsubscribe`;

module.exports = {
  subscribeUrl,
  unsubscribeUrl,
  segmentsUrl,
  schemaUrl,
  searchUrl,
  authUrl,
  createUrl
};
