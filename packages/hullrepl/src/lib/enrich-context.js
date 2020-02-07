const shell = require("shelljs");
const _ = require("lodash");
const moment = require("moment");
const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const path = require("path");
const parse = require("csv-parse");
const highland = require("highland");

const utils = require("hull/src/utils");

const fakeAndImport = require("./fake-and-import");

export default function enrich({ context, ctx, credentials }) {
  context.ctx = ctx;
  context.utils = utils;
  context.updatePrivateSettings = async newSettings => {
    const connector = await ctx.client.get("app");
    _.merge(connector.private_settings, newSettings);
    return ctx.client.put(connector.id, {
      private_settings: connector.private_settings
    });
  };

  context.moment = moment;
  context.lo = _;
  context.lodash = _;
  context.shell = shell;
  context.sourceUrl = ctx.connector.source_url;
  context.agent = superagent
    .agent()
    .use(prefixPlugin(_.trim(ctx.connector.source_url, "/")))
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
}
