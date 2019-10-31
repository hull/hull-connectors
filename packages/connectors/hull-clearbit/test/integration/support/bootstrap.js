import Minihull from "minihull";
import Hull from "hull";
import nock from "nock";
import jwt from "jwt-simple";
import Server from "../../../server/server";

const noop = () => {};

module.exports = function bootstrap({ beforeEach, afterEach, port, segments }) {
  const mocks = {};
  mocks.nock = nock;
  beforeEach(done => {
    const minihull = new Minihull();
    minihull.listen(8001).then(done);
    minihull.stubUserSegments(segments);
    mocks.firehose = "firehose";
    minihull.userUpdate = ({ connector, messages }, callback = noop) => {
      const t = setTimeout(() => {
        callback([]);
      }, 1800);
      mocks.minihull.on("incoming.request@/api/v1/firehose", req => {
        clearTimeout(t);
        callback(
          req.body.batch.map(r => ({
            ...r,
            claims: jwt.decode(r.headers["Hull-Access-Token"], "", true)
          }))
        );
      });
      minihull.smartNotifyConnector(
        connector,
        `http://localhost:${port}/smart-notifier`,
        "user:update",
        messages
      );
    };
    const server = Server({
      hostSecret: "1234",
      skipSignatureValidation: true,
      Hull,
      port,
      clientConfig: {
        // flushAt: 1,
        protocol: "http",
        firehoseUrl: "http://localhost:8001/api/v1/firehose"
      }
    });
    mocks.minihull = minihull;
    mocks.server = server;
  });

  afterEach(() => {
    mocks.minihull.close();
    mocks.server.close();
    mocks.nock.cleanAll();
  });

  return mocks;
};
