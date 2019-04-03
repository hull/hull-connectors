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
new Hull.Connector(config()).start();
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
