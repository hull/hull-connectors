# hull-repl
> Simple REPL for hull.io connector SDK

You need to provide connector credentials, which you can find on connector settings pane in advanced section.

## Get started:

```
yarn repl hull-sidebar --id=CONNECTOR_ID --secret=CONNECTOR_SECRET --organization=ORGANIZATION
```

## Example
```
hull > ctx.client.get("app")
```
This command will return info about `CONNECTOR_ID` you specified.

## Import util
In authorized repl you can execute following line to generate 10 faked users with name and email:

```
hull > fakeUsers("name_of_the_file.json", 10)
```

then import it to the organization of the ship:

```
hull > importFile("name_of_the_file.json")
```

## Custom hull-repl protocol

To easily launch hull-repl from browser install hull-repl as global package
and run:

```
npm i -g hull-repl
hull-repl --install-protocol
```


## `ctx`
Hull Context object (see docs)

## `utils`
Hull Utils object

## `updatePrivateSettings` helper to update settings for this connector instance. use like this:
```js
updatePrivateSettings({ foo: "bar" })
```

## utilities libs
- moment: `moment`
- lodash: `lo`
- shelljs: `shell`
- parse: `parse`
- highland: `highland`
- sourceUrl: Connector's source URL

## superagent: `agent`
use like this:
```
agent.get("/some_connector_url") -> credentials will be added for you
```


## fakeUsers

## fakeAccounts

## importFile
