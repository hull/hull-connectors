module.exports = (nock) => {
  // Note: Customer.io returns an empty response body
  nock("https://track.customer.io")
    .put(/\/api\/v1\/customers\//)
    .reply(200, {});

  nock("https://track.customer.io")
    .post(/\/api\/v1\/customers\/[\w%.]+\/events/)
    .reply(200, {});
};
