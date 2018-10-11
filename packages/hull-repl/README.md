# hull-repl
> Simple REPL for hull.io connector SDK

You need to provide connector credentials, which you can find on connector settings pane in advanced section.

## Get started:

```
npm start
# or yarn start
```

then provide: `SHIP_ID`, `SHIP_SECRET` and `SHIP_ORG`.

## Example
```
hull > ctx.client.get("app")
```
This command will return info about `SHIP_ID` you specified.

## Import util
In authorized repl you can execute following line to generate 10 faked users
with name and email:

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
