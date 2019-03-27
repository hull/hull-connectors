//@flow
declare function describe(name: string, callback: Function): void;
declare function before(callback: Function): void;
declare function beforeEach(callback: Function): void;
declare function afterEach(callback: Function): void;
declare function it(name: string, callback: Function): void;
declare function test(name: string, callback: Function): void;

import Minihull from "minihull";
import axios from "axios";
import _ from "lodash";
import chai, { expect } from "chai";
import chaiSubset from "chai-subset";
import jwt_decode from "jwt-decode";
import { encrypt } from "../../server/lib/crypto";
import bootstrap from "./support/bootstrap";

import TESTS from "./support/tests";

chai.use(chaiSubset);

describe("Connector for webhooks endpoint", function test() {
  let minihull;
  let server;

  beforeEach(done => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);
    minihull.stubUsersSegments([]);

    setTimeout(() => {
      done();
    }, 1500);
  });

  afterEach(() => {
    minihull.close();
    server.close();
  });

  const config = {
    organization: "localhost:8001",
    ship: "123456789012345678901234",
    secret: "1234"
  };
  const token = encrypt(config, "1234");

  TESTS.map(function performTest({ title, body, code, expects }) {
    it(title, async () => {
      minihull.stubConnector({
        id: "123456789012345678901234",
        private_settings: {
          code
        }
      });
      await axios.post(
        `http://localhost:8000/webhooks/123456789012345678901234/${token}`,
        body
      );
      return new Promise((resolve, reject) => {
        minihull.on("incoming.request", req => {
          try {
            const batch = _.map(req.body.batch, b => ({
              ...b,
              claims: jwt_decode(b.headers["Hull-Access-Token"])
            }));
            // console.log(JSON.stringify(batch, null, 2));
            expect(batch).to.containSubset(expects);
            setTimeout(() => {
              resolve();
            }, 500);
          } catch (err) {
            reject(err);
          }
        });
      });
    });
    return true;
  });
});
