module.exports = (nock) => {
  nock("https://api.madkudu.com/v1")
    .post("/companies")
    .reply(500);
};
