module.exports = (nock) => {
  nock("https://api.madkudu.com/v1")
    .post("/companies")
    .reply(200, {
      domain: "madkudu.com",
      object_type: "company",
      properties: null
    });
};
