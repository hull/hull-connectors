#!/usr/bin/env node
const shell = require("shelljs");
// const url = require("url");
const repl = require("repl");
// const Hull = require("hull");
const vm = require("vm");
const _ = require("lodash");
// const Promise = require("bluebird");
const minimist = require("minimist");
const moment = require("moment");
const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const path = require("path");
const parse = require("csv-parse");
const highland = require("highland");

const utils = require("hull/src/utils");

const resolveClientCredentials = require("./lib/resolve-client-credentials");
const getHullContext = require("./lib/get-hull-context");
const fakeAndImport = require("./lib/fake-and-import");

(() => {
  const argv = minimist(process.argv.slice(2));

  if (argv["install-protocol"]) {
    shell.cd(__dirname);
    shell.exec(
      "osacompile -o HullReplProtocol.app HullReplProtocol/HullReplProtocol.scpt"
    );
    shell.exec(
      "cp HullReplProtocol/Info.plist HullReplProtocol.app/Contents/Info.plist"
    );
    shell.exec("open HullReplProtocol.app");
    process.exit(0);
  }

  return resolveClientCredentials(argv);
})().then(credentials => {
  process.env.NODE_REPL_HISTORY = `${process.cwd()}/.hull_repl`;

  async function initializeContext(context) {
    const hullCtx = await getHullContext(credentials);
    context.ctx = hullCtx;
    context.hullClient = hullCtx.client;
    context.connectorId = process.env.HULL_ID;

    if (process.env.HULL_REPL_PATH) {
      const normalizedConnectorName = `hull-${hullCtx.connector.name
        .toLowerCase()
        .replace("hull-", "")}`;
      try {
        process.chdir(
          path.join(process.env.HULL_REPL_PATH, normalizedConnectorName)
        );
      } catch (err) {
        // eslint ignore
      }
      console.log(`working directory: ${process.cwd()}`);
    }
    context.utils = utils;
    context.organization = process.env.HULL_ORG;
    context.updatePrivateSettings = newSettings => {
      return hullCtx.client.get("app").then(connector => {
        _.merge(connector.private_settings, newSettings);
        return hullCtx.client.put(connector.id, {
          private_settings: connector.private_settings
        });
      });
    };
    context.loadServiceClient = () => {
      try {
        context.ServiceClient = context.hotRequire("server/lib/service-client");
        context.serviceClient = new context.ServiceClient(context.ctx);
      } catch (err) {
        console.error(err);
      }
    };
    context.loadSyncAgent = async () => {
      try {
        context.SyncAgent = context.hotRequire("server/lib/sync-agent");
        context.syncAgent = new context.SyncAgent(context.ctx);
      } catch (err) {
        console.error(err);
      }
    };
    context.moment = moment;
    context.lo = _;
    context.lodash = _;
    context.shell = shell;
    context.sourceUrl = hullCtx.connector.source_url;
    context.agent = superagent
      .agent()
      .use(prefixPlugin(_.trim(hullCtx.connector.source_url, "/")))
      .use(request => {
        const end = request.end;
        request.end = cb => {
          end.call(request, (err, res) => {
            const newRes = _.pick(
              res,
              "body",
              "headers",
              "statusCode",
              "redirect",
              "clientError",
              "serverError",
              "type",
              "charset"
            );
            cb(err, newRes);
          });
        };
      })
      .query(credentials);
    context.parse = parse;
    context.highland = highland;
    context.hotRequire = modulePath => {
      const relativePath = path.join(process.cwd(), modulePath);
      delete require.cache[require.resolve(relativePath)];
      // eslint-disable-next-line global-require,import/no-dynamic-require
      return require(relativePath);
    };
    context.loadScript = scriptPath => {
      return context.hotRequire(scriptPath).call(context);
    };

    context.fakeUsers = fakeAndImport.fakeUsers.bind(context);
    context.fakeAccounts = fakeAndImport.fakeAccounts.bind(context);
    context.importFile = fakeAndImport.importFile.bind(context);

    this.displayPrompt();
  }

  const replServer = repl.start({
    prompt: "hull > ",
    useColors: true,
    eval(cmd, context, filename, callback) {
      const result = vm.runInContext(cmd, context);
      if (result && result.then instanceof Function) {
        return result.then(
          res => {
            callback(null, res);
          },
          err => {
            callback(null, err);
          }
        );
      }
      return callback(null, result);
    }
  });

  initializeContext.call(replServer, replServer.context);
  replServer.on("reset", initializeContext);
  replServer.on("exit", () => process.exit());
});
