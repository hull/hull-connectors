module.exports = (nock) => {
  // Note: Customer.io returns an empty response body
  nock("https://track.customer.io")
    .persist()
    .put(/\/api\/v1\/customers\//)
    .reply(200, {});
};
