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

  describe("sendUserMessages", () => {
    const scenariosToRun = [
      "customer-insert",
      "customer-insert-30plusattribs",
      "customer-insert-skip-noidvalue",
      "customer-update",
      "customer-update-event-insert",
      "customer-update-skip-nochanges",
      "customer-update-skip-notinsegments",
      "customer-delete"
    ];
    scenariosToRun.forEach((scenarioName) => {
      test(`${scenarioName}`, () => {
        const smartNotifierPayload = require(`./scenarios/${scenarioName}/smart-notifier-payload`)();
        ctxMock.connector = smartNotifierPayload.connector;
        ctxMock.ship = smartNotifierPayload.connector;

        const syncAgent = new SyncAgent(ctxMock);

        require(`./scenarios/${scenarioName}/api-response-expectations`)(nock);

        return syncAgent.sendUserMessages(smartNotifierPayload.messages)
          .then(() => {
            require(`./scenarios/${scenarioName}/ctx-expectations`)(ctxMock);
            expect(nock.isDone()).toBe(true);
          });
      });
    });
  });

  describe("handleWebhook", () => {
    const scenariosToRun = [
      "webhook-emaildelivered",
      "webhook-emailsent",
      "webhook-emailopened",
      "webhook-emailconverted",
      "webhook-emaildrafted-noemail"
    ];
    scenariosToRun.forEach((scenarioName) => {
      test(`${scenarioName}`, () => {
        const webhookPayload = require(`./scenarios/${scenarioName}/webhook-payload`)();
        const ctxMockWebhook = require(`./scenarios/${scenarioName}/context-config`)();

        const syncAgent = new SyncAgent(ctxMockWebhook);

        return syncAgent.handleWebhook(webhookPayload).then(() => {
          require(`./scenarios/${scenarioName}/ctx-expectations`)(ctxMockWebhook);
        });
      });
    });
  });
});
