// const rest = require("restler");
const superagent = require("superagent");
const pkg = require("../../package.json");

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": `Hull Node Client version: ${pkg.version}`
};

function strip(url = "") {
  if (url.indexOf("/") === 0) {
    return url.slice(1);
  }
  return url;
}

function isAbsolute(url = "") {
  return /http[s]?:\/\//.test(url);
}

function perform(
  client,
  config = {},
  method = "get",
  path,
  params = {},
  options = {}
) {
  const methodCall = superagent[method];
  if (!methodCall) {
    throw new Error(`Unsupported method ${method}`);
  }

  const agent = methodCall(path)
    .set({
      ...DEFAULT_HEADERS,
      "Hull-App-Id": config.id,
      "Hull-Access-Token": config.token,
      "Hull-Organization": config.organization,
      ...(params.headers || options.headers || {})
    })
    .retry(2, function retryCallback(err, res) {
      const retryCount = this._retries;
      if (err && err.timeout) {
        client.logger.debug("client.timeout", {
          timeout: err.timeout,
          retryCount,
          path,
          method
        });
        return true;
      }
      if (res && res.statusCode >= 500 && retryCount <= 2) {
        client.logger.debug("client.fail", {
          statusCode: res.statusCode,
          retryCount,
          path,
          method
        });
        return true;
      }
      if (err) {
        client.logger.debug("client.fail.unknown", {
          err: err.toString()
        });
      }
      return false;
    });

  if (config.userId && typeof config.userId === "string") {
    agent.set("Hull-User-Id", config.userId);
  }

  if (options.timeout) {
    agent.timeout(options.timeout);
  }

  if (method === "get") {
    agent.timeout(options.timeout || 10000);
  }

  if (method === "get") {
    return agent.query(params).then(res => res.body);
  }
  return agent.send(params).then(res => res.body);
}

function format(config, url) {
  if (isAbsolute(url)) {
    return url;
  }
  return `${config.get("protocol")}://${config.get("organization")}${config.get(
    "prefix"
  )}/${strip(url)}`;
}

module.exports = function restAPI(
  client,
  config,
  url,
  method,
  params,
  options = {}
) {
  const token = config.get("sudo")
    ? config.get("secret")
    : config.get("accessToken") || config.get("secret");
  const conf = {
    token,
    id: config.get("id"),
    secret: config.get("secret"),
    userId: config.get("userId"),
    organization: config.get("organization")
  };

  const path = format(config, url);
  return perform(client, conf, method.toLowerCase(), path, params, options);
};
