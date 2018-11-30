module.exports = (nock) => {
  nock("https://track.customer.io")
    .delete(/\/api\/v1\/customers\//)
    .reply(200, {});
};
