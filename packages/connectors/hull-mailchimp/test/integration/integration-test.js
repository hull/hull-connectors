/* global describe, it, before, beforeEach */
const Promise = require("bluebird");
const { expect } = require("chai");
const crypto = require("crypto");
const faker = require("faker");
const _ = require("lodash");

const ServiceClient = require("../../server/lib/service-client");

const listId = process.env.E2E_TEST_LIST_ID;

let mailchimpClient;
let INTEREST_CATEGORY_ID;
let INTEREST_GROUP_ID;
let STATIC_SEGMENT;
let secondStaticSegmentId;
let mergeFieldId;
let REQUIRED_MERGE_TAG;

let fixtures;
const firstEmailAddress = faker.internet.email().toLowerCase();
const secondEmailAddress = faker.internet.email().toLowerCase();
const thirdEmailAddress = faker.internet.email().toLowerCase();
const fourthEmailAddress = faker.internet.email().toLowerCase();
const fifthEmailAddress = faker.internet.email().toLowerCase();
function generateFixtures() {
  return {
    validUser: {
      email_type: "html",
      merge_fields: {
        FNAME: "Foo",
        LNAME: "Bar",
        [REQUIRED_MERGE_TAG]: "STRING VALUE"
      },
      interests: {
        [INTEREST_GROUP_ID]: true
      },
      email_address: firstEmailAddress,
      status_if_new: "subscribed"
    },
    secondValidUser: {
      email_type: "html",
      merge_fields: {
        FNAME: "Foo",
        LNAME: "Bar",
        [REQUIRED_MERGE_TAG]: "STRING VALUE"
      },
      interests: {
        [INTEREST_GROUP_ID]: true
      },
      email_address: secondEmailAddress,
      status_if_new: "subscribed"
    },
    thirdValidUser: {
      email_type: "html",
      merge_fields: {
        FNAME: "Foo1",
        LNAME: "Bar2",
        [REQUIRED_MERGE_TAG]: "STRING VALUE"
      },
      interests: {
        [INTEREST_GROUP_ID]: true
      },
      email_address: fifthEmailAddress,
      status_if_new: "subscribed"
    },
    invalidEmailUser: {
      email_type: "html",
      merge_fields: {
        FNAME: "Foo",
        LNAME: "Bar"
      },
      interests: {
        [INTEREST_GROUP_ID]: true
      },
      email_address: "foo@bar.com",
      status_if_new: "subscribed"
    },
    invalidMergeTagUser: {
      email_type: "html",
      merge_fields: {
        FNAME: "Foo",
        LNAME: "Bar",
        ASDFASF: "ASDFAS"
      },
      interests: {
        [INTEREST_GROUP_ID]: true
      },
      email_address: "foo@mar.com",
      status_if_new: "subscribed"
    },
    invalidUniqueEmailId: {
      unique_email_id: "abc123",
      email_address: thirdEmailAddress,
      merge_fields: {
        FNAME: "Foo",
        LNAME: "Bar",
        [REQUIRED_MERGE_TAG]: "STRING VALUE"
      }
    },
    invalidId: {
      id: "zxcvbnm12345678",
      email_address: fourthEmailAddress,
      merge_fields: {
        FNAME: "Foo",
        LNAME: "Bar",
        [REQUIRED_MERGE_TAG]: "STRING VALUE"
      }
    }
  };
}

describe("Mailchimp Client", function () {
  this.timeout(6000);
  before(function () {
    if (!process.env.E2E_TEST_API_KEY
      || !process.env.E2E_TEST_DOMAIN
      || !process.env.E2E_TEST_LIST_ID) {
      return this.skip();
    }

    mailchimpClient = new ServiceClient({
      client: {
        logger: {
          debug: () => {}
        }
      },
      metric: {
        value: () => {},
        increment: () => {}
      },
      ship: {
        private_settings: {
          api_key: process.env.E2E_TEST_API_KEY,
          domain: process.env.E2E_TEST_DOMAIN,
          mailchimp_list_id: process.env.E2E_TEST_LIST_ID
        }
      }
    });
  });

  beforeEach(() => {
    fixtures = generateFixtures();
  });

  it("should respond 200 for list details", () => {
    return mailchimpClient.get("/lists/{{listId}}")
      .then(({ status }) => {
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 for creating new interest category", () => {
    return mailchimpClient.post("/lists/{{listId}}/interest-categories")
      .send({
        title: "Test interest category",
        type: "checkboxes"
      })
      .then(({ status, body }) => {
        INTEREST_CATEGORY_ID = body.id;
        expect(status).to.equal(200);
      });
  });

  it("should respond 400 for when creating interest group with the name", () => {
    return mailchimpClient.post("/lists/{{listId}}/interest-categories")
      .send({
        title: "Test interest category",
        type: "checkboxes"
      })
      .then(({ status, body }) => {
        expect(body.detail).to.have.string("An interest category with the title 'Test interest category' already exists.");
        expect(status).to.equal(400);
      });
  });

  it("should respond 200 for interest category", () => {
    return mailchimpClient.get("/lists/{{listId}}/interest-categories")
      .then(({ status }) => {
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 for creating new interest group", () => {
    return mailchimpClient.post("/lists/{{listId}}/interest-categories/{{interestCategoryId}}/interests")
      .tmplVar({ interestCategoryId: INTEREST_CATEGORY_ID })
      .send({
        name: "Test interest group",
      })
      .then(({ status, body }) => {
        INTEREST_GROUP_ID = body.id;
        expect(status).to.equal(200);
      });
  });

  it("should respond 400 for trying to create interest category with existing name", () => {
    return mailchimpClient.post(`/lists/${listId}/interest-categories/${INTEREST_CATEGORY_ID}/interests`)
      .send({
        name: "Test interest group",
      })
      .then(({ status, body }) => {
        expect(body.detail).to.have.string("Cannot add \"Test interest group\" because it already exists on the list.");
        expect(status).to.equal(400);
      });
  });

  it.skip("should allow to create max of 60 interest groups", function () {
    this.timeout(40000);
    const numbers = Array.apply(null, { length: 59 }).map(Number.call, Number); // eslint-disable-line prefer-spread
    return Promise.mapSeries(numbers, (number) => {
      return mailchimpClient.post("/lists/{{listId}}/interest-categories/{{interestCategoryId}}/interests")
        .tmplVar({ interestCategoryId: INTEREST_CATEGORY_ID })
        .send({
          name: `Test interest group ${number}`,
        });
    }, { concurrency: 8 })
      .then((results) => {
        expect(results[0].status).to.equal(200);
        expect(results[57].status).to.equal(200);
        expect(results[58].status).to.equal(400);
        expect(results[58].body.detail).to.have.string("Cannot have more than 60 interests per list (across all categories).");
      });
  });

  it("should respond 200 with interests groups in category", () => {
    return mailchimpClient.get(`/lists/${listId}/interest-categories/${INTEREST_CATEGORY_ID}/interests`)
      .then(({ status }) => {
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 when creating a new static segment", () => {
    return mailchimpClient.post(`/lists/${listId}/segments`)
      .send({
        name: "Testing segment",
        static_segment: []
      })
      .then(({ body, status }) => {
        STATIC_SEGMENT = body.id;
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 when creating another static segment with the same name", () => {
    return mailchimpClient.post(`/lists/${listId}/segments`)
      .send({
        name: "Testing segment",
        static_segment: []
      })
      .then(({ body, status }) => {
        secondStaticSegmentId = body.id;
        expect(status).to.equal(200);
      });
  });

  it("responds 200 with static segments", () => {
    return mailchimpClient.get(`/lists/${listId}/segments`)
      .then(({ status }) => {
        expect(status).to.equal(200);
      });
  });

  it("responds 200 when creating a new merge field", () => {
    return mailchimpClient.post(`/lists/${listId}/merge-fields`)
      .send({
        tag: "REQUIRED_M",
        name: "Required Testing Merge Tag",
        type: "text",
        required: true
      })
      .then(({ body, status }) => {
        mergeFieldId = body.merge_id;
        REQUIRED_MERGE_TAG = body.tag;
        expect(status).to.equal(200);
      });
  });

  it.skip("trims down the merge tag", () => {});
  it.skip("responds 400 when creating merge tag with the same name", () => {});

  it("should respond 200 for mixed valid and invalid batch upsert", () => {
    return mailchimpClient
      .post(`/lists/${listId}`)
      .send({ members: [fixtures.validUser, fixtures.invalidEmailUser, fixtures.invalidMergeTagUser], update_existing: true })
      .then(({ body, status }) => {
        expect(body.new_members[0].merge_fields[REQUIRED_MERGE_TAG]).to.equal("STRING VALUE");
        expect(body.total_created).to.equal(1);
        expect(body.total_updated).to.equal(0);
        expect(body.error_count).to.equal(2);
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 for mixed user update, create and errors", () => {
    const validUser = _.cloneDeep(fixtures.validUser);
    validUser.merge_fields[REQUIRED_MERGE_TAG] = "UPDATED STRING";
    return mailchimpClient
      .post(`/lists/${listId}`)
      .send({ members: [validUser, fixtures.invalidEmailUser, fixtures.invalidMergeTagUser, fixtures.secondValidUser], update_existing: true })
      .then(({ body, status }) => {
        expect(body.updated_members[0].merge_fields[REQUIRED_MERGE_TAG]).to.equal("UPDATED STRING");
        expect(body.total_created).to.equal(1);
        expect(body.total_updated).to.equal(1);
        expect(body.error_count).to.equal(2);
        expect(status).to.equal(200);
      });
  });

  it("should reject whole batch if there are duplicates", () => {
    return mailchimpClient
      .post(`/lists/${listId}`)
      .send({ members: [fixtures.validUser, fixtures.invalidEmailUser, fixtures.invalidEmailUser], update_existing: true })
      .then(({ status }) => {
        expect(status).to.equal(400);
      });
  });

  it("respond with 200 even for invalid users only", () => {
    return mailchimpClient
      .post(`/lists/${listId}`)
      .send({ members: [fixtures.invalidEmailUser, fixtures.invalidMergeTagUser], update_existing: true })
      .then(({ status, body }) => {
        expect(body.errors[0].email_address).to.equal("foo@bar.com");
        expect(body.errors[0].error).to.have.string("foo@bar.com looks fake or invalid, please enter a real email address.");

        expect(body.errors[1].email_address).to.equal("foo@mar.com");
        expect(body.errors[1].error).to.have.string("Your merge fields were invalid.");

        expect(status).to.equal(200);
      });
  });

  it("updating non existing user using unique_email_id", () => {
    return mailchimpClient
      .post(`/lists/${listId}`)
      .send({ members: [fixtures.invalidUniqueEmailId], update_existing: true })
      .then(({ body, status }) => {
        expect(body.errors[0].email_address).to.equal(fixtures.invalidUniqueEmailId.email_address);
        expect(body.errors[0].error).to.have.string("The resource submitted could not be validated");
        expect(body.total_created).to.equal(0);
        expect(body.total_updated).to.equal(0);
        expect(body.error_count).to.equal(1);
        expect(status).to.equal(200);
      });
  });

  it("updating non existing user using id", () => {
    return mailchimpClient
      .post(`/lists/${listId}`)
      .send({ members: [fixtures.invalidId], update_existing: true })
      .then(({ body, status }) => {
        expect(body.errors[0].email_address).to.equal(fixtures.invalidId.email_address);
        expect(body.errors[0].error).to.have.string("The resource submitted could not be validated");
        expect(body.total_created).to.equal(0);
        expect(body.total_updated).to.equal(0);
        expect(body.error_count).to.equal(1);
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 with error array when setting invalid interest group", () => {
    const validUser = _.cloneDeep(fixtures.validUser);
    validUser.interests.abc = false;

    return mailchimpClient
      .post(`/lists/${listId}`)
      .send({ members: [validUser], update_existing: true })
      .then(({ body, status }) => {
        expect(body.errors[0].email_address).to.equal(validUser.email_address);
        expect(body.errors[0].error).to.have.string("Invalid interest ID: 'abc'.");
        expect(body.total_created).to.equal(0);
        expect(body.total_updated).to.equal(0);
        expect(body.error_count).to.equal(1);
        expect(status).to.equal(200);
      });
  });

  it("should return an error when trying to add the same users multiple times in short time", function () {
    this.timeout(30000);
    const subriberHash = crypto.createHash("md5").update(fixtures.thirdValidUser.email_address).digest("hex");
    // number below is the smallest number of operations we have found is causing the error
    const tries = new Array(13);
    return Promise.map(tries, () => {
      return mailchimpClient
        .post(`/lists/${listId}`)
        .send({ members: [fixtures.thirdValidUser], update_existing: true })
        .then((res) => {
          return mailchimpClient
            .delete(`/lists/${listId}/members/${subriberHash}`)
            .then(() => res);
        });
    }, { concurrency: 1 })
      .then((results) => {
        const errRes = results.filter(r => r.body.errors.length === 1);
        expect(errRes[0].body.errors[0].email_address).to.equal(fixtures.thirdValidUser.email_address);
        expect(errRes[0].body.errors[0].error).to.have.string("has signed up to a lot of lists very recently; we're not allowing more signups for now");
      });
  });

  it("should allow to add an user to an existing static segment", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .send({ members_to_add: [fixtures.validUser.email_address] })
      .then(({ body, status }) => {
        expect(body.total_added).to.equal(1);
        expect(body.total_removed).to.equal(0);
        expect(body.error_count).to.equal(0);
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 and return error array when trying to save the user again to the same segment", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .send({ members_to_add: [fixtures.validUser.email_address] })
      .then(({ body, status }) => {
        expect(body.errors[0].email_addresses).to.eql([fixtures.validUser.email_address]);
        expect(body.errors[0].error).to.have.string("Email addresses already exist in the static segment");
        expect(body.total_added).to.equal(0);
        expect(body.total_removed).to.equal(0);
        expect(body.error_count).to.equal(1);
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 and mixed added/error when some users already are added to the static segment", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .send({ members_to_add: [fixtures.validUser.email_address, fixtures.secondValidUser.email_address] })
      .then(({ body, status }) => {
        expect(body.errors[0].email_addresses).to.eql([fixtures.validUser.email_address]);
        expect(body.errors[0].error).to.have.string("Email addresses already exist in the static segment");
        expect(body.total_added).to.equal(1);
        expect(body.total_removed).to.equal(0);
        expect(body.error_count).to.equal(1);
        expect(status).to.equal(200);
      });
  });

  it("should respond 400 when all of emails do not exist", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .send({ members_to_add: [fixtures.invalidEmailUser.email_address] })
      .then(({ body, status }) => {
        expect(body.errors[0].field).to.eql("members_to_add");
        expect(body.errors[0].message).to.have.string("None of the emails provided were subscribed to the list");
        expect(status).to.equal(400);
      });
  });

  it("should respond 400 when all of emails do not exist, even in case of duplicates", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .send({ members_to_add: [fixtures.invalidEmailUser.email_address, fixtures.invalidEmailUser.email_address] })
      .then(({ body, status }) => {
        expect(body.errors[0].field).to.eql("members_to_add");
        expect(body.errors[0].message).to.have.string("None of the emails provided were subscribed to the list");
        expect(status).to.equal(400);
      });
  });

  it("should respond 400 when removing from segment when all of emails do not exist", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .send({ members_to_remove: [fixtures.invalidEmailUser.email_address, fixtures.invalidEmailUser.email_address] })
      .then(({ body, status }) => {
        expect(body.errors[0].field).to.eql("members_to_remove");
        expect(body.errors[0].message).to.have.string("None of the emails provided were subscribed to the list");
        expect(status).to.equal(400);
      });
  });

  it("should respond 200 when removing user, wrong emails are ignored", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .send({ members_to_remove: [fixtures.validUser.email_address, fixtures.invalidEmailUser.email_address, fixtures.invalidEmailUser.email_address] })
      .then(({ body, status }) => {
        expect(body.total_added).to.equal(0);
        expect(body.total_removed).to.equal(1);
        expect(body.error_count).to.equal(0);
        expect(status).to.equal(200);
      });
  });

  it("should respond 200 for users with mixed success error results", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .send({ members_to_remove: [fixtures.validUser.email_address, fixtures.secondValidUser.email_address, fixtures.invalidEmailUser.email_address, fixtures.invalidEmailUser.email_address] })
      .then(({ body, status }) => {
        expect(body.errors).to.be.an("array");
        expect(body.errors[0].email_addresses[0]).to.equal(fixtures.validUser.email_address);
        expect(body.errors[0].error).to.have.string("Email addresses do not exist in the static segment");
        expect(body.total_added).to.equal(0);
        expect(body.total_removed).to.equal(1);
        expect(body.error_count).to.equal(1);
        expect(status).to.equal(200);
      });
  });

  it("should respond with 404 when trying to work on an non existing segment", () => {
    return mailchimpClient
      .post(`/lists/${listId}/segments/123asdf`)
      .send({ members_to_remove: [fixtures.validUser.email_address, fixtures.secondValidUser.email_address, fixtures.invalidEmailUser.email_address, fixtures.invalidEmailUser.email_address] })
      .then(({ status }) => {
        expect(status).to.equal(404);
      });
  });

  it.skip("should return rate limit in case of too many resquests", function () {
    this.retries(3);
    const subriberHash = crypto.createHash("md5").update(fixtures.validUser.email_address).digest("hex");
    const requests = [];
    for (let i = 0; i < 40; i += 1) {
      requests.push(mailchimpClient.get(`/lists/${listId}/members/${subriberHash}`));
    }
    return Promise.all(requests)
      .then((results) => {
        const errors = results.filter(r => r.status === 429);
        expect(errors[0].status).to.equal(429);
        expect(errors[0].body.title).to.equal("Too Many Requests");
        expect(errors[0].body.detail).to.equal("You have exceeded the limit of 10 simultaneous connections.");
      });
  });

  it("should allow to delete existing members", () => {
    const subriberHash = crypto.createHash("md5").update(fixtures.validUser.email_address).digest("hex");
    return mailchimpClient
      .delete(`/lists/${listId}/members/${subriberHash}`)
      .then((res) => {
        expect(res.status).to.equal(204);
      });
  });

  it("should allow to delete existing members", () => {
    const subriberHash = crypto.createHash("md5").update(fixtures.secondValidUser.email_address).digest("hex");
    return mailchimpClient
      .delete(`/lists/${listId}/members/${subriberHash}`)
      .then((res) => {
        expect(res.status).to.equal(204);
      });
  });

  it("should allow to delete an interest category", () => {
    return mailchimpClient.delete(`/lists/${listId}/interest-categories/${INTEREST_CATEGORY_ID}`)
      .then(({ status }) => {
        expect(status).to.equal(204);
      });
  });

  it("should allow to delete a static segment", () => {
    return mailchimpClient.delete(`/lists/${listId}/segments/${STATIC_SEGMENT}`)
      .then(({ status }) => {
        expect(status).to.equal(204);
      });
  });

  it("should allow to delete a static segment", () => {
    return mailchimpClient.delete(`/lists/${listId}/segments/${secondStaticSegmentId}`)
      .then(({ status }) => {
        expect(status).to.equal(204);
      });
  });

  it("should allow to delete a merge field", () => {
    return mailchimpClient.delete(`/lists/${listId}/merge-fields/${mergeFieldId}`)
      .then(({ status }) => {
        expect(status).to.equal(204);
      });
  });
});
