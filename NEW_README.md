## Live Debugging

- Add `debugger` statements to your server code
- Install https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj
- Click the extension icon, switch to `auto`

> Chrome Dev Tools will attach to your node server app and let you debug - 1000% time saved.

You're welcome

## Ngrok

```
$ yarn ngrok hull-incoming-webhooks

ngrok by @inconshreveable

Session Status                online
Account                       Hull Dev Team (Plan: Basic)
Version                       2.3.25
Region                        Europe (eu)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://hull-incoming-webhooks.eu.ngrok.io -> http://localhost:8082
Forwarding                    https://hull-incoming-webhooks.eu.ngrok.io -> http://localhost:8082
```

## Webpack

Add client-side code to `src` in a connector's folder ->

- all root level .js will be compiled.
- all root-level .scss will be compiled

Hot Reload is included.

## Debugger

```
$ yarn dev hull-incoming-webhooks
```

p
-> Boots connector with the `debug` library started with `DEBUG=hull*` so you can see all of Hull's debugging stack

## Flow Types

Love and embrace flow types. The uniform method signature is:

For Incoming Data (Webhooks, HTML requests, JSON requests etc...);

```js
// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
export default async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) => HullExternalResponse {
  try {
    const data = await processData(message);
    return {
      status: 200,
      data,
      // text: "foo",
      // pageLocation: "bar.html" -> renders this template with `data` passed to it if defined
    };
  } catch (err) {
    return {
      status: 500,
      error: err.toString()
    }
  }
}

```

For Notifications and Batches:

```js
// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
export default async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  try {
    const response = await processData(messages);
    return {
      flow_control: {
        type: "next",
        size: 10,
        in: 10,
        in_time: 10
      }
    };
  } catch (err) {
    return {
      flow_control: { type: "retry" }
    };
  }
};
```

## HullConnectorConfig

An object returned by `/config.js` -> uses a strict Flow type of `HullConnectorConfig` - check `/packages/hull/types.js` to get all the details;

We recommend to boot the connector like this:

```
// @flow
import Hull from "hull";
import config from "./config";
new Hull.Connector(config).start();
```

## Manifest

Each of the following Keys can accept standard options:

- json
- html
- tabs
- incoming
- schedules
- statuses

They all accept the common pattern:

```js
{
  json: [
    {
      url: string, // "/some_url",
      handler: string, // "myJsonHandler",
      method?: "post" | "get" | "put" | "all",
      options: {
        cache?: {
          key: string,
          secret: Object
        },
        respondWithError?: boolean,
        disableErrorHandling?: boolean,
        fireAndForget?: boolean,
        credentialsFromQuery?: boolean,
        credentialsFromNotification?: boolean,
        strict?: boolean,
        format?: "json" | "html",
        bodyParser?: "urlencoded" | "json"
      }
    }
  ]
}
```

The `handler` key defines what function to use to respond on this url. in `config.js` -> HullConnectorConfig.handler:

```
handlers = {
  json: { myJsonHandler }
}
```

## Hull-managed HTTP Client.

The Hull-managed HTTP Client is based on the latest superagent with some added plugins. It handles the following for you:

- Promise Interface
- Full instrumentation for Logging & metrics
- Throttling (defaults set through ConnectorConfig)
- Retries (defaults set through ConnectorConfig)
- Timeouts (timeout defaults set through ConnectorConfig)
- prefixes (defaults set through ConnectorConfig)

Checkout [./packages/hull/src/types.js#251](HullHTTPClientConfig)
More docs here: https://visionmedia.github.io/superagent/#agents-for-global-state

```
const connectorConfig = {
  ...
  httpClientConfig = {
    timeout: {
      response: 5000,  // Wait 5 seconds for the server to start sending,
      deadline: 60000, // but allow 1 minute for the file to finish loading.
    },
    /* timeout: 60000, */ Alternative syntax to only use `deadline`
    prefix: "/foo",
    retries: 2 //Be careful when setting retries for the entire agent: you don't want to auto-retry requests that aren't idempotent. A better implementation is to call `.retries(n)` in each call.
    throttle: {
      rate: 1,
      ratePer: 2,
      concurrent: 2
    }
  }
}
function(ctx, messages){
  const { request } = ctx;
  //Instance of SuperAgent
  request.
}
```

## Hull Client retries & timeouts.

Moved timeout & retry to `HullClientConfig`:
Checkout [./packages/hull-client/src/typesjs#239](HullClientConfig);

```
{
  ...
  timeout: 3000 //3s - previously configured with process.env.BATCH_TIMEOUT
  retry: 3000 //3s - previously configured with process.env.BATCH_RETRY
}
```

## aes-Encrypted Tokens

the library now exposes and parses an additional, aes-encrypted token.
In addition to the jwt-signed `clientCredentialsToken`, you can now use `clientCredentialsEncryptedToken` which is aes-encrypted - useful when you don't want the secret to leak out...

The token will be encrypted and decrypted with the `hostSecret` you passed in the `HullConnectorConfig`.

```js
function userUpdate(ctx, messages) {
  ctx.clientCredentialsEncryptedToken; // aes-encrypted token.
}
```

To generate a client from this token, you can pass the it in the querystring as `hullToken`, `token` or `state` - any of those three values will be tried for a token if we didn't find anything else anywhere. No middleware required.

```
  https://my-connector.dev?token=AES_ENCRYPTED_TOKEN
  https://my-connector.dev?hullToken=AES_ENCRYPTED_TOKEN
  https://my-connector.dev?state=AES_ENCRYPTED_TOKEN
  -> Hull will auto-parse this token to generate an Environment.
```

If you need to pass this token another way, you can add a middleware to your `connectorConfig` that will fetch the token from where you stored it and pass it in `req.hull.clientCredentialsToken`

Here's a full example of a handler parsing things the right way:

```js
/* @flow */
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "hull";

export default function fetchToken(
  req: HullRequest,
  res: HullResponse,
  next: NextFunction
) {
  if (req.query.conf) {
    req.hull = req.hull || {};
    req.hull.clientCredentialsEncryptedToken = req.query.conf.toString();
  }
  next();
}

const config: HullConnectorConfig = {
  ...
  hostSecret: "ABCD",
  middlewares: [fetchToken],
  ...
}
Hull.Connector(config).start();
```

This will make sure the token is in the right place for the rest of the stack to parse and create the right config.

_NOTE: This also parses JWT tokens with the same logic. We just try to decode both formats_

## oauth handler

The OAuth Handler has been rewritten.
It is now stricter and requires less configuration. Here's how you use it:

### Manifest

```json
{
  "tabs": [
    {
      "title": "Credentials",
      "setup": true,
      "url": "/auth",
      "size": "small",
      "editable": false,
      "handler": "oauthHandler",
      "options": {
        "type": "oauth",
        "params": {
          "name": "Slack",
          "strategy": {
            "scope": ["bot", "channels:write"],
            "skipUserProfile": true
          },
          "views": {
            "login": "login.html",
            "home": "home.html",
            "failure": "failure.html",
            "success": "success.html"
          }
        }
      }
    }
  ]
}
```

### Code

```js
/* @flow */
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage,
  HullOAuthHandlerParams,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";
import { Strategy } from "passport-slack";

async function isSetup(ctx: HullContext, message: HullIncomingHandlerMessage){
  const { connector, client } = ctx;
  const { query = {} } = message;
  //Logic to define if connector is properly setup here.
  //...
  //return the data you wish to pass to the page, and a redirect code.
  if (connector_is_setup) {
    return { status: 200, data: { credentials: true, connected: true } }
  } else {
    return { status: 404, data: { credentials: false, connected: false } }
  }
}
async function onAuthorize(ctx: HullContext, message: HullOauthAuthorizeMessage): HullOAuthAuthorizeResponse {
  //actions to perform when receiving auth code. Will be present in message.account.
  //message contains all the interesting components of a HTTP request: See HullIncomingHandlerMessage
  const { body, ip, url, method, query, params, path, account } = message;
  const { accessToken, params } = account;
  const { ok, bot = {}, team_id, user_id, incoming_webhook = {} } = params;
  //Your logic to extract data from the Oauth response
  //Reply with a set of updated connector settings - will be saved before redirecting.
  return {
    private_settings: {
      accessToken
    }
  }
}
async function onLogin(ctx: HullContext, message: HullIncomingHandlerMessage){
  // Logic to perform on Login
  // Best used to process form parameters, to be submitted to the Login sequence. Useful to add strategy-specific parameters, such as a portal ID for Hubspot for instance.
  return {
    // any data object that you want to pass to the passport.authorize method:
    // http://www.passportjs.org/docs/authorize/
    // passport.authorize(AUTH URL, { parameters })
    // callback URL is passed automatically, and `state`
  }
}

const connectorConfig: HullConnectorConfig = {
  // ...
  handlers: {
    // ...
    html: {
      oauthHandler: function(): HullOAuthHandlerParams{
        return {
          Strategy,
          clientID
          clientSecret,
          isSetup,
          onAuthorize,
          onLogin
        }
      }
    }
  }
}

Hull.Connector(connectorConfig).start();
```
