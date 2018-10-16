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
/*
  describe("sendAccountMessages", () => {
    const scenariosToRun = ["lead-insert"];
    scenariosToRun.forEach(scenarioName => {
      test(`${scenarioName}`, () => {
        const notifierPayload = require(`./scenarios/${scenarioName}/notifier-payload`)();
        ctxMock.connector = notifierPayload.connector;
        ctxMock.ship = notifierPayload.connector;

        const syncAgent = new SyncAgent(ctxMock);

        require(`./scenarios/${scenarioName}/api-response-expectations`)(nock);
        console.log("Here");
        return syncAgent
          .sendAccountMessages(notifierPayload.messages)
          .then(() => {
            require(`./scenarios/${scenarioName}/ctx-expectations`)(ctxMock);
            expect(nock.isDone()).toBe(true);
          });
      });
    });
  });
*/

  describe("fetchOutreachAccounts", () => {
    const scenariosToRun = ["accounts-fetch"];
    scenariosToRun.forEach(scenarioName => {
      test(`${scenarioName}`, () => {
        const schedulerPayload = require(`./scenarios/${scenarioName}/scheduler-payload`)();
        ctxMock.connector = schedulerPayload.connector;
        ctxMock.ship = schedulerPayload.connector;
        const syncAgent = new SyncAgent(ctxMock);
        require(`./scenarios/${scenarioName}/api-response-expectations`)(nock);
        return syncAgent.fetchOutreachAccounts().then(() => {
          require(`./scenarios/${scenarioName}/ctx-expectations`)(ctxMock);
          expect(nock.isDone()).toBe(true);
        });
      });
    });
  });

  describe("fetchOutreachProspects", () => {
    const scenariosToRun = ["prospects-fetch"];
    scenariosToRun.forEach(scenarioName => {
      test(`${scenarioName}`, () => {
        const schedulerPayload = require(`./scenarios/${scenarioName}/scheduler-payload`)();
        ctxMock.connector = schedulerPayload.connector;
        ctxMock.ship = schedulerPayload.connector;
        const syncAgent = new SyncAgent(ctxMock);
        require(`./scenarios/${scenarioName}/api-response-expectations`)(nock);
        return syncAgent.fetchOutreachProspects().then(() => {
          require(`./scenarios/${scenarioName}/ctx-expectations`)(ctxMock);
          expect(nock.isDone()).toBe(true);
        });
      });
    });
  });
});
