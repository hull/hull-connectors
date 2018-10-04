/* global describe, it, beforeEach, afterEach */
import Minihull from "minihull";
import assert from "assert";
import bootstrap from "./support/bootstrap";
import TypeformMock from "./support/typeform-mock";

describe("connector for fetch operation", function test() {
  let minihull;
  let server;
  const typeformMock = new TypeformMock();

  const private_settings = {
    api_key: "0987654321",
    typeform_uid: "123456789",
    question_as_email: "typeform_id"
  };

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);

    minihull.stubConnector({
      id: "123456789012345678901234",
      private_settings
    });

    minihull.stubSegments([
      {
        name: "testSegment",
        id: "hullSegmentId"
      }
    ]);

    setTimeout(() => {
      done();
    }, 1000);
  });

  afterEach(() => {
    minihull.close();
    server.close();
  });

  it("should fetch all users for /fetch-all endpoint from typeform for answer type equal to choice", (done) => {
    private_settings.sync_answers_to_hull = [
      {
        question_id: "list_41759738_choice_52978517",
        hull: "hull_answer_id"
      }
    ];
    const getTypeformClientNock = typeformMock.setUpGetClientNock({
      list_41759738_choice_52978517: "A",
      list_41759738_choice_52978518: "B"
    });

    minihull
      .postConnector(
        "123456789012345678901234",
        "http://localhost:8000/fetch-all"
      )
      .then(() => {
        setTimeout(() => {
          getTypeformClientNock.done();
        }, 1000);
      });

    minihull.on("incoming.request@/api/v1/firehose", (req) => {
      const batch = req.body.batch;

      assert(batch[0].type === "traits");
      assert(batch[0].body.hull_answer_id.length === 2);
      assert(batch[0].body.hull_answer_id[0] === "A");
      assert(batch[0].body.hull_answer_id[1] === "B");

      assert(batch[1].type === "track");
      assert(batch[1].body.event === "Form Submitted");
      assert(batch[1].body.useragent === "hull");
      assert(batch[1].body.source === "typeform");

      done();
    });
  });

  it("should fetch all users for /fetch-all endpoint from typeform for another answer type than choice", (done) => {
    private_settings.sync_answers_to_hull = [
      {
        question_id: "notchoice_1",
        hull: "hull_answer_id"
      }
    ];
    const getTypeformClientNock = typeformMock.setUpGetClientNock({
      notchoice_1: "abc"
    });

    minihull
      .postConnector(
        "123456789012345678901234",
        "http://localhost:8000/fetch-all"
      )
      .then(() => {
        setTimeout(() => {
          getTypeformClientNock.done();
        }, 1000);
      });

    minihull.on("incoming.request@/api/v1/firehose", (req) => {
      const batch = req.body.batch;

      assert(batch[0].type === "traits");
      assert(batch[0].body.hull_answer_id === "abc");

      assert(batch[1].type === "track");
      assert(batch[1].body.event === "Form Submitted");
      assert(batch[1].body.useragent === "hull");
      assert(batch[1].body.source === "typeform");

      done();
    });
  });

  it("should fetch users for /fetch endpoint and answer type equal to choice", (done) => {
    private_settings.sync_answers_to_hull = [
      {
        question_id: "list_41759738_choice_52978517",
        hull: "hull_answer_id"
      }
    ];
    const getTypeformClientNock = typeformMock.setUpGetClientNock({
      list_41759738_choice_52978517: "A",
      list_41759738_choice_52978518: "B"
    });

    minihull
      .postConnector("123456789012345678901234", "http://localhost:8000/fetch")
      .then(() => {
        setTimeout(() => {
          getTypeformClientNock.done();
        }, 1000);
      });

    minihull.on("incoming.request@/api/v1/firehose", (req) => {
      const batch = req.body.batch;

      assert(batch[0].type === "traits");
      assert(batch[0].body.hull_answer_id.length === 2);
      assert(batch[0].body.hull_answer_id[0] === "A");
      assert(batch[0].body.hull_answer_id[1] === "B");

      assert(batch[1].type === "track");
      assert(batch[1].body.event === "Form Submitted");
      assert(batch[1].body.useragent === "hull");
      assert(batch[1].body.source === "typeform");

      done();
    });
  });

  it("should fetch users for /fetch endpoint and answer type different than choice", (done) => {
    private_settings.sync_answers_to_hull = [
      {
        question_id: "notchoice_1",
        hull: "hull_answer_id"
      }
    ];
    const getTypeformClientNock = typeformMock.setUpGetClientNock({
      notchoice_1: "foo"
    });

    minihull
      .postConnector("123456789012345678901234", "http://localhost:8000/fetch")
      .then(() => {
        setTimeout(() => {
          getTypeformClientNock.done();
        }, 1000);
      });

    minihull.on("incoming.request@/api/v1/firehose", (req) => {
      const batch = req.body.batch;

      assert(batch[0].type === "traits");
      assert(batch[0].body.hull_answer_id === "foo");

      assert(batch[1].type === "track");
      assert(batch[1].body.event === "Form Submitted");
      assert(batch[1].body.useragent === "hull");
      assert(batch[1].body.source === "typeform");

      done();
    });
  });
});
