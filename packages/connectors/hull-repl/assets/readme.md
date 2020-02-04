# Hull REPL

The REPL connector enables you to run your own logic and manually send data to Hull, using a simple Javascript environment

## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” on the REPL card. After installation, click on the "Code Editor" button on your connector's home screen.  You will be presented with a two column Dashboard layout. The left column will hold your Javascript **Code** that will be run when you click the "RUN" button. The actual data that will be sent is previewed in the **Output** of the right column.

You can begin writing your own code right away, but you probably will want to gather some useful background information first. We recommend to start with the [execution model](#Execution-Model) which clarifies when your code is run before you move on to the data that is available as Input:

- [Code basics](#Code-basics)
- [External libraries](#External-Libraries)

## Features

The Hull REPL allows your team to write Javascript that results in calling the Hull API to create or update users and accounts. It's a useful way to update the data in your Hull instance.

The REPL connector can `add traits`, `update traits`, `alias` and `unalias` users and accounts and `emitevents` for Users

Should you need it, You can use the `request` library ([https://github.com/request/request](https://github.com/request/request)) to call external services or send data to webhooks. We advise to avoid high volume calls here.

Async/await and ES6 are supported by the connector, allowing you to write elegant code.

## Execution Model

Before writing your first line of code, it is vital to have a good understanding when this code will be executed:

- The REPL environment only runs when you click the `RUN` button in the UI. No automatic calls will be made.

## How to send data

```javascript
  hull.asUser({ USER_CLAIMS }).traits({ ATTRIBUTE_NAME: <value> });
  hull.asUser({ USER_CLAIMS }).track("New Event", { PROPERTY_NAME: <value> });
  hull.asUser({ USER_CLAIMS }).alias({ anonymous_id: NEW_IDENTIFIER });
  hull.asUser({ USER_CLAIMS }).unalias({ anonymous_id: IDENTIFIER_TO_REMOVE });

  hull.asAccount({ ACCOUNT_CLAIMS }).traits({ ATTRIBUTE_NAME: <value> });
  hull.asAccount({ ACCOUNT_CLAIMS }).alias({ anonymous_id: NEW_IDENTIFIER });
  hull.asAccount({ ACCOUNT_CLAIMS }).unalias({ anonymous_id: IDENTIFIER_TO_REMOVE });

  // Link User and Account
  hull.asUser({ USER_CLAIMS }).account({ ACCOUNT_CLAIMS });
```

For naming conventions, see the Golden Rules section below.

Of course you can set multiple attributes at once by passing a more complex object like:

```javascript
  hull.asUser({ USER_CLAIMS }).traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

Using this function signature, these attributes are stored at the top level for the target Entity

### Attribute Groups

If you want to make use of ***grouped attributes***, you can use the overloaded signature of the function, passing the group name as source in the second parameter:

```javascript
  hull.asUser({ USER_CLAIMS }).traits({ bar: "baz" }, { source: "foo" })
```

Alternatively, you can pass the fully qualified name for the grouped attribute. Those two signatures will have the same results

```javascript
  hull.asUser({ USER_CLAIMS }).traits({ "foo/bar": baz });
```

If you want to “delete” an attribute, you can use the same function calls as described above and simply set `null`  as value.

```javascript
  hull.asUser({ USER_CLAIMS }).traits({ foo: null });
```


### Incrementing and decrementing values (Atomic Operations)

Given the distributed nature of computation, if you want to increment or decrement a counter, you need to take special care. Since the code might run multiple times in parallel, the following operation will not be reliable:

To get reliable results, you need to use `atomic operations`. Here's the correct way to do so:

_DO THIS INSTEAD_:

```javascript
 hull.asUser({ USER_CLAIMS }).traits({ coconuts: { operation: 'inc', value: 1 } })
```

Where:
- Operation: `inc`, `dec`, `setIfNull`
- Value: The value to either increment, decrement or set if nothing else was set before.

### Limitations

The Platform refuses to store Domains in accounts with a domain being a Generic Email Domain - See the list of email domains we refuse here: https://github.com/smudge/freemail/tree/master/data  - This helps preventing accounts with thousands of users under domains like `gmail.com` because you'd have written the following code:

## External Libraries

The processor exposes several external libraries that can be used:

|**Variable**| **Library name**                                                  |
|------------| ------------------------------------------------------------------|
|`_`         | The lodash library. (https://lodash.com/)                         |
|`moment`    | The Moment.js library(https://momentjs.com/)                      |
|`urijs`     | The URI.js library (https://github.com/medialize/URI.js/)         |
|`request`   | The simplified request client (https://github.com/request/request)|

Please visit the linked pages for documentation and further information about these third party libraries.

## Using Request.

The library exposes `request-promise` to allow you to call external APIs seamlessly:

```javascript
const response = await request({
    uri: 'https://api.github.com/user/repos',
    qs: {
        access_token: 'xxxxx xxxxx' // -> uri + '?access_token=xxxxx%20xxxxx'
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
})
console.log(response)
```

## Golden Rules

- DO use snake_case rather than camelCase in your naming.
- DO write human readable keys for traits. Don’t use names like `ls` for lead score, just name it `lead_score`.
- DO use `_at` or `_date` as suffix to your trait name to let hull recognize the values as valid dates. You can pass either
  - a valid unix timestamp in seconds or milliseconds or
  - a valid string formatted according to ISO-8601
- DO make sure that you use the proper type for new traits because this cannot be changed later. For example, if you pass `"1234"` as the value for trait `customerId`, the trait will be always a treated as string, even if you intended it to be a number.
- DO NOT write code that generates dynamic keys for traits
- DO NOT use large arrays because they are slowing down the compute performance of your data. Arrays with up to 50 values are okay.
- DO NOT create infinite loops because they count towards the limits of your plan. Make sure to guard emitting events with `track` calls and to plan accordingly when setting a trait to the current timestamp.

## Debugging and Logging

When operating you might want to log certain information so that it is available for debugging or auditing purposes while other data might be only of interest during development. The processor allows you to do both:

- `console.log` is used for development purposes only and will display the result in the console of the user interface but doesn’t write into the operational logs.
- `console.info` is used to display the result in the console of the user interface and does also write an operational log.

You can access the operational logs via the tab “Logs” in the user interface. The following list explains the various log messages available:

| **Message**                | **Description**                                                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compute.console.info`     | The manually logged information via `console.info`.                                                                                                                                                                           |
| `incoming.account.success` | Logged after attributes of an account have been successfully computed.                                                                                                                                                        |
| `incoming.account.error`      | Logged if an error is encountered during compute. The data of the error provides additional information whether the error occurred in the sandboxed custom code or in the processor itself (see boolean value for `sandbox`). |
