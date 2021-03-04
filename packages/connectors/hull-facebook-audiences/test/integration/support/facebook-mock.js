module.exports = function mocks(nock) {
  nock = nock("https://graph.facebook.com/v9.0");
  return {
    getNock: () => nock,
    setUpGetAudiencesNock: (fulfilled) => {
      if (!fulfilled) {
        return nock
          .get("/act_123/customaudiences")
          .query(true)
          .reply(200, {
            data: [],
            paging: {}
          });
      }

      return nock
        .get("/act_123/customaudiences")
        .query(true)
        .reply(200, {
          data: [
            {
              id: "hullsegment0hullsegment1",
              description: "hullsegment0hullsegment1"
            },
            {
              id: "testsegment0testsegment1",
              description: "testsegment0testsegment1"
            }
          ],
          paging: {}
        });
    },
    setupGetAudienceDetailNock: (audienceID) => {
      return nock
        .get(`/${audienceID}`)
        .query(true)
        .reply(200, {
          id: `${audienceID}`,
          description: `${audienceID}`
        });
    },
    setUpCreateAudiencesNock: (audienceId) => nock
      .post("/act_123/customaudiences")
      .query(true)
      .reply(200, {
        id: audienceId
      }),
    setUpCreateUserInAudienceNock: (audienceId, bodyValidator = () => true) => nock
      .post(`/${audienceId}/users`, (body) => bodyValidator(body))
      .query(true)
      .reply(200),
    setUpDeleteUserInAudienceNock: (audienceId) => nock
      .post(`/${audienceId}/users`)
      .query({ method: "delete" })
      .reply(200)
  };
};
