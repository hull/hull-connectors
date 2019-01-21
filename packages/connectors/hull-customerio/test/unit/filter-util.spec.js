const FilterUtil = require("../../server/lib/sync-agent/filter-util");

const SHARED_MESSAGES = require("../../server/lib/shared-messages");

describe("FilterUtil", () => {
  describe("deduplicateMessages", () => {
    test("should not throw if no messages are passed to dedupe", () => {
      const util = new FilterUtil();
      const actual = util.deduplicateMessages();
      expect(actual).toHaveLength(0);
    });

    test("should filter deduplicate messages by user id but preserve all events", () => {
      const messages = [
        {
          user: {
            id: 1,
            name: "John Doe",
            indexed_at: "2018-01-01"
          },
          events: [
            {
              event_id: "abc1",
              event: "foo 1"
            },
            {
              event_id: "xyz9",
              event: "foo 1"
            }
          ]
        },
        {
          user: {
            id: 1,
            name: "John Smith",
            indexed_at: "2018-02-01"
          },
          events: [
            {
              event_id: "abc1",
              event: "foo 1"
            },
            {
              event_id: "dfg3",
              event: "foo baz boo"
            }
          ]
        }
      ];

      const util = new FilterUtil();

      const actual = util.deduplicateMessages(messages);

      expect(actual[0].events).toHaveLength(3);
      expect(actual[0].user).toEqual({
        id: 1,
        name: "John Smith",
        indexed_at: "2018-02-01"
      });
      expect(actual).toHaveLength(1);
    });
  });

  describe("matchesSynchronizedSegments", () => {
    test("should match an envelope if at least one segment matches", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1"
          },
          segments: [
            {
              id: "1234",
              name: "Test Segment 1"
            },
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.matchesSynchronizedSegments(envelope);
      expect(actual).toBeTruthy();
    });

    test("should match an envelope if multiple segments match", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1"
          },
          segments: [
            {
              id: "1234",
              name: "Test Segment 1"
            },
            {
              id: "0987",
              name: "Test Segment 2"
            },
            {
              id: "5678",
              name: "Test Segment 3"
            }
          ]
        }
      };

      const actual = util.matchesSynchronizedSegments(envelope);
      expect(actual).toBeTruthy();
    });

    test("should not match an envelope if no segment matches", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1"
          },
          segments: [
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.matchesSynchronizedSegments(envelope);
      expect(actual).toBeFalsy();
    });

    test("should match an envelope if at least one segment matches with custom segment property name", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "user_segments",
        ignoreUsersWithoutEmail: true
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1"
          },
          user_segments: [
            {
              id: "1234",
              name: "Test Segment 1"
            },
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.matchesSynchronizedSegments(envelope);
      expect(actual).toBeTruthy();
    });
  });

  describe("filterUsersBySegment", () => {
    test("should skip a user without an email if it's whitelisted", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1"
          },
          segments: [
            {
              id: "1234",
              name: "Test Segment 1"
            },
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.filterUsersBySegment([envelope]);
      expect(actual.toSkip).toHaveLength(1);
      expect(actual.toInsert).toHaveLength(0);
      expect(actual.toUpdate).toHaveLength(0);
      expect(actual.toSkip[0]).toEqual({ message: envelope.message, skipReason: SHARED_MESSAGES.SKIP_NOEMAIL, opsResult: "skip" });
    });

    test("should skip a user if it's not in the whitelisted segments and deletion is disabled", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true,
        deletionEnabled: false
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1",
            email: "test@hull.io"
          },
          segments: [
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.filterUsersBySegment([envelope]);
      expect(actual.toSkip).toHaveLength(1);
      expect(actual.toInsert).toHaveLength(0);
      expect(actual.toUpdate).toHaveLength(0);
      expect(actual.toSkip[0]).toEqual({ message: envelope.message, skipReason: SHARED_MESSAGES.SKIP_NOTINSEGMENTS, opsResult: "skip" });
    });

    test("should mark a user to insert if it's in the whitelisted segments", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true,
        deletionEnabled: false,
        userAttributeServiceId: "id"
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1",
            email: "test@hull.io"
          },
          segments: [
            {
              id: "1234",
              name: "Test Segment 1"
            },
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.filterUsersBySegment([envelope]);
      expect(actual.toSkip).toHaveLength(0);
      expect(actual.toInsert).toHaveLength(1);
      expect(actual.toUpdate).toHaveLength(0);
      expect(actual.toInsert[0]).toEqual({ message: envelope.message });
    });

    test("should mark a user to update if it's in the whitelisted segments", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true,
        deletionEnabled: false,
        userAttributeServiceId: "id"
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1",
            email: "test@hull.io",
            "traits_customerio/created_at": "2018-01-31T12:00:00.000Z"
          },
          segments: [
            {
              id: "1234",
              name: "Test Segment 1"
            },
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.filterUsersBySegment([envelope]);
      expect(actual.toSkip).toHaveLength(0);
      expect(actual.toInsert).toHaveLength(0);
      expect(actual.toUpdate).toHaveLength(1);
      expect(actual.toUpdate[0]).toEqual({ message: envelope.message });
    });

    test("should mark a user to delete if it's not in the whitelisted segments, has a created_at timestamp and deletion is enabled", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true,
        deletionEnabled: true,
        userAttributeServiceId: "id"
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1",
            email: "test@hull.io",
            "traits_customerio/created_at": "2018-01-31T12:00:00.000Z"
          },
          segments: [
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.filterUsersBySegment([envelope]);
      expect(actual.toSkip).toHaveLength(0);
      expect(actual.toInsert).toHaveLength(0);
      expect(actual.toUpdate).toHaveLength(0);
      expect(actual.toDelete).toHaveLength(1);
      expect(actual.toDelete[0]).toEqual({ message: envelope.message });
    });

    test("should skip a user if it's not in the whitelisted segments, has no created_at timestamp and deletion is enabled", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true,
        deletionEnabled: true,
        userAttributeServiceId: "id"
      };
      const util = new FilterUtil(opts);

      const envelope = {
        message: {
          user: {
            id: "usr1",
            email: "test@hull.io"
          },
          segments: [
            {
              id: "0987",
              name: "Test Segment 2"
            }
          ]
        }
      };

      const actual = util.filterUsersBySegment([envelope]);
      expect(actual.toSkip).toHaveLength(1);
      expect(actual.toInsert).toHaveLength(0);
      expect(actual.toUpdate).toHaveLength(0);
      expect(actual.toSkip[0]).toEqual({ message: envelope.message, skipReason: SHARED_MESSAGES.SKIP_NOTINSEGMENTS, opsResult: "skip" });
    });
  });

  describe("filterEvents", () => {
    test("should skip events that are not whitelisted and insert the remaining ones", () => {
      const opts = {
        synchronizedSegments: ["1234", "5678"],
        segmentPropertyName: "segments",
        ignoreUsersWithoutEmail: true,
        synchronizedEvents: ["page"]
      };
      const util = new FilterUtil(opts);

      const cioEvents = [{
        name: "page",
        data: {
          url: "https://hull.io/test",
          title: "Test Page"
        }
      },
      {
        name: "Clicked Demo Button",
        data: {
          url: "https://hull.io/get-demo",
          time_spent: 15000
        }
      }];

      const actual = util.filterEvents(cioEvents);

      expect(actual.toSkip).toHaveLength(1);
      expect(actual.toInsert).toHaveLength(1);
      expect(actual.toUpdate).toHaveLength(0);
      expect(actual.toDelete).toHaveLength(0);

      expect(actual.toSkip[0]).toEqual(cioEvents[1]);
      expect(actual.toInsert[0]).toEqual(cioEvents[0]);
    });
  });
});
