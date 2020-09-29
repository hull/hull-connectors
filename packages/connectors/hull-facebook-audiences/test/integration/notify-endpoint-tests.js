/* global describe, it, beforeEach, afterEach */

const Minihull = require("minihull");
const bootstrap = require("./support/bootstrap");
const FacebookMock = require("./support/facebook-mock");


describe("Connector for notify endpoint", function test() {
  let minihull;
  let server;
  const facebookMock = new FacebookMock();

  const private_settings = {
    field_email: "email",
    field_first_name: "firstName",
    field_last_name: "lastName",
    synchronized_segments: ["hullsegment0hullsegment1", "testsegment0testsegment1"],
    synchronized_segments_mapping: [
      { segment_id: "hullsegment0hullsegment1", customer_file_source: "USER_PROVIDED_ONLY" },
      { segment_id: "testsegment0testsegment1", customer_file_source: "BOTH_USER_AND_PARTNER_PROVIDED" }
    ],
    facebook_ad_account_id: "123",
    facebook_access_token: "321"
  };

  const connector = { id: "123456789012345678901234", private_settings };
  const usersSegments = [{
    name: "hullSegmentId",
    id: "hullsegment0hullsegment1"
  }, {
    name: "testSegment",
    id: "testsegment0testsegment1"
  }];

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);
    minihull.stubUsersSegments(usersSegments);

    setTimeout(() => {
      done();
    }, 1000);
  });

  afterEach(() => {
    minihull.close();
    server.close();
  });

  it("should send users to facebook", (done) => {
    const getAudiencesNock = facebookMock.setUpGetAudiencesNock();
    const getAudiencesNock2 = facebookMock.setUpGetAudiencesNock();

    const createAudienceMock = facebookMock.setUpCreateAudiencesNock("hullsegment0hullsegment1");
    const createAudienceMock2 = facebookMock.setUpCreateAudiencesNock("testsegment0testsegment1");

    const getAudiencesNock3 = facebookMock.setUpGetAudiencesNock(true);

    const getAudienceDetailsNock = facebookMock.setupGetAudienceDetailNock("hullsegment0hullsegment1");
    const getAudienceDetailsNock2 = facebookMock.setupGetAudienceDetailNock("testsegment0testsegment1");

    const createUserInAudienceNock = facebookMock.setUpCreateUserInAudienceNock("testsegment0testsegment1");
    const deleteUserInAudienceNock = facebookMock.setUpDeleteUserInAudienceNock("hullsegment0hullsegment1");

    minihull.notifyConnector(connector, "http://localhost:8000/smart-notifier", "user:update", [{
      user: { email: "foo@bar.com", id: "34567", firstName: "James", lastName: "Bond" },
      changes: {
        segments: {
          "left": [{
            "id": "hullsegment0hullsegment1",
            "name": "Approved users",
            "type": "users_segment",
            "query": {},
            "created_at": "2016-12-21T11:38:26Z",
            "updated_at": "2016-12-21T11:38:26Z"
          }],
          "entered": [{
            "id": "testsegment0testsegment1",
            "name": "Test users",
            "type": "users_segment",
            "query": {},
            "created_at": "2016-12-21T11:38:26Z",
            "updated_at": "2016-12-21T11:38:26Z"
          }]
        },
      },
      events: [],
      segments: [{ id: "testsegment0testsegment1", name: "Test users" }]
    }], usersSegments).then(() => {
      setTimeout(() => {
        createAudienceMock.done();
        createAudienceMock2.done();

        getAudiencesNock.done();
        getAudiencesNock2.done();

        getAudiencesNock3.done();

        getAudienceDetailsNock.done();
        getAudienceDetailsNock2.done();

        createUserInAudienceNock.done();
        deleteUserInAudienceNock.done();
        done();
      }, 1500);
    });
  });
});
