/* eslint-disable global-require, import/no-dynamic-require */
const nock = require("nock");

const SyncAgent = require("../../server/lib/sync-agent");

const { ContextMock } = require("./helper/connector-mock");

/*
 * SyncAgent tests scenarios triggered by smart-notifier messages,
 * for more details about the scenarios, see ./scenarios/README.md
*/

describe("SyncAgent", () => {
  let ctxMock;

  beforeEach(() => {
    ctxMock = new ContextMock();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test("smoke test", () => {
    expect(ctxMock).toBeDefined();
  });

  describe("sendAccountUpdateMessages", () => {
    const scenariosToRun = [
      "enrich-account",
      "enrich-account-skip-alreadyenriched",
      "enrich-account-skip-noclearbitdata",
      "enrich-account-skip-notinsegments",
      "enrich-account-error-invalidmkresponse",
      "enrich-account-error-apistatus500",
      "enrich-account-skip-notenabled",
      "enrich-account-skip-noapikey"
    ];
    scenariosToRun.forEach((scenarioName) => {
      test(`${scenarioName}`, () => {
        const smartNotifierPayload = require(`./scenarios/${scenarioName}/smart-notifier-payload`)();
        ctxMock.connector = smartNotifierPayload.connector;
        ctxMock.ship = smartNotifierPayload.connector;

        const syncAgent = new SyncAgent(ctxMock);

        require(`./scenarios/${scenarioName}/api-response-expectations`)(nock);

        return syncAgent.sendAccountUpdateMessages(smartNotifierPayload.messages)
          .then(() => {
            require(`./scenarios/${scenarioName}/ctx-expectations`)(ctxMock);
            expect(nock.isDone()).toBe(true);
          });
      });
    });
  });
});
