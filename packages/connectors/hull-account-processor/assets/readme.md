# Hull Account Processor

The Account Processor enables you to run your own logic on attributes associated to Accounts by writing Javascript.

## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” on the Account Processor card. After installation, you will be presented with the three column Dashboard layout. The left column displays the **Input** which is an Account with, segments and attributes, the middle column will hold your Javascript **Code** that transforms it to the **Output** of the right column. The Output itself displays the changed attributes of the account.

You can begin writing your own code right away, but you probably might want to gather some useful background information first. We recommend to start with the [execution model](#Execution-Model) which clarifies when your code is run before you move on to the data that is available as Input:

- [Changes](#Input---Changes)
- [Account](#Input---Account)
- [Account Segments](#Input---Account-Segments)

Read more about writing code:

- [Code basics](#Code-basics)
- [External libraries](#External-Libraries)
- [Golden Rules](#Golden-Rules)

## Features

The Hull Account Processor allows your team to write Javascript and transform data in Hull for accounts. You can emit events based of attribute changes or calculate a lead score, the Processor is your multi-tool when it comes to data in Hull.

The Processor can `add traits`, `update traits` for accounts.

You can use the `request` library ([https://github.com/request/request](https://github.com/request/request)) to call external services or send data to webhooks.

Async/await and ES6 are supported by the connector, allowing you to write elegant code.

## Execution Model

Before writing your first line of code, it is vital to have a good understanding when this code will be executed:

- The Processor runs on micro-batched data, which means that not every changed attribute and newly added event will lead to a run of the Processor.
- The Processor receives events exactly once, or in other words the exposed events are the ones between now and the last run of the Processor.

## Input - Changes

The `changes` object represents all changes to an account that triggered the execution of this processor and contains information about all modified data since the last re-compute of the account. Changes itself is an object in Javascript which exposes the following top-level properties:

- `changes.is_new` indicates whether the account created is new and has just been created or not.
- `changes.account_segments`, which holds all account segments the Account has entered and left since the last recompute, accessible via `changes.account_segments.entered` and `changes.account_segments.left`. Each segment is an object itself composed of the following properties `created_at` , `id`, `name`, `type`and `updated_at`.
- `changes.account` which is an object that is exposes each changed attribute as property whose value is an array. The array has the old value as the first argument and the new one as the second. For example, if the email is set the first time, you can access it via `changes.account.domain` and the value will look like this `[null,"www.hull.io"]`

The following code shows an example of changes:

```javascript
    {
      changes: {
        is_new: false,
        account_segments: {
          entered: [
            {
              created_at: "2017-09-01 09:30:22.458Z",
              id: "dfbdd69d-1e6d-4a58-8031-c721a88f71f6",
              name: "All Accounts",
              type: "account",
              updated_at: "2017-09-01 10:04:01.938Z",
            },
            // more segments if applicable
          ],
          left: [
            // omitted for brevity
          ]
        },
        account: {
          name: [null, "Hull"],
          domain: [null, "www.hull.io"],
          mrr: [null, "500"]
        }
      }
    }
```


## Input - Account

The account object consists of a nested trait hierarchy. This means you can access all traits directly by their name, e.g. to get the name of an account, just use `account.name` in the code.
Accounts do have various identifiers: the Hull ID (`account.id`), an External ID (`account.external_id` ) and Domain (`account.domain`).
The following snippet shows an example of an account:

```javascript
    {
      account: {
        id: "7ad5524d-14ce-41fb-8de4-59ba9ccf130a",
        external_id: "8476c4c7-fe7d-45b1-a30d-cd532621325b",
        domain: "hull.io",
        name: "Hull Inc.",
        clearbit: {
          name: "Hull Inc."
        },
        ... // more attributes in nested hierarchy
      },
      [...] // omitted for clarity
    }
```

Please note that the `external_id` is only present if the account has been created via another connector such as the SQL importer or Segment.

## Input - Account Segments

You can access the segments for the Account via `account_segments` which is an array of objects itself. Each segment object has an identifier and name that can be accessed via `id` and `name` and metadata such as `type`, `updated_at` and `created_at`.

The following code shows an example of the `account_segments` data:

```javascript
    {
      "account_segments": [
        {
          "id": "59b14b212fa9835d5d004825",
          "name": "Valuable Accounts",
          "type": "accounts_segment",
          "updated_at": "2017-09-07T13:35:29Z",
          "created_at": "2017-09-07T13:35:29Z"
        },
        {
          "id": "5995ce9f38b35ffd2100ecf4",
          "name": "New Customers",
          "type": "accounts_segment",
          "updated_at": "2017-08-17T17:13:03Z",
          "created_at": "2017-08-17T17:13:03Z"
        },
        // additional segments
      ]
    }
```


## Code basics

You can access the **input data** as described above, here is the summary of available Javascript objects:

| Variable Name                      | Description                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `account`                          | Provides access to the account’s attributes.                                   |
| `changes`                          | Represents all changes in account attributes since the last re-computation.       |
| `account_segments`                 |  Provides a list of all account segments the Account belongs to |

Please note that some of the input data shown on the left might be fake data that showcases additional fields available in your organization but that might not be applicable to all accounts.

In addition to the input, you can also access the **settings** of the processor:

|**Variable Name**| **Description**                                                                                                                                                |
|-----------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`connector`           | Provides access to processor settings, e.g. `connector.private_settings` gives you access to the settings specified in `manifest.json` as shown in the Advanced tab.|
|`variables`           | Provides the values that you can store in the `Settings` tab of the connector. Usually to avoid storing Access Keys in the code itself |

Now that you have a good overview of which variables you can access to obtain information, let’s move on to the functions that allow you to **manipulate data**.

## How to set Account attributes

Lets first explore how you can **change attributes for an account**. As you already know from the Input - Account section above, there are two types of attributes, ungrouped and grouped attributes. ***ungrouped attributes*** can be set with the not-overloaded function call

```javascript
  hull.traits({ ATTRIBUTE_NAME: <value> })
```

For naming conventions, see the Golden Rules section below.

Of course you can set multiple attributes at once by passing a more complex object like:

```javascript
  hull.traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

Using this function signature, these attributes are stored at the top level for the target Account

### Attribute Groups

If you want to make use of ***grouped attributes***, you can use the overloaded signature of the function, passing the group name as source in the second parameter:

```javascript
  hull.traits({ bar: "baz" }, { source: "foo" })
```

Alternatively, you can pass the fully qualified name for the grouped attribute. Those two signatures will have the same results

```javascript
  hull.traits({ "foo/bar": baz });
```

If you want to “delete” an attribute, you can use the same function calls as described above and simply set `null`  as value.

```javascript
  hull.traits({ foo: null });
```


### Incrementing and decrementing values (Atomic Operations)

Given the distributed nature of computation, if you want to increment or decrement a counter, you need to take special care. Since the code might run multiple times in parallel, the following operation will not be reliable:

_DO NOT DO THIS_:

```javascript
  hull.traits({ coconuts: account.coconuts+1 });
```

To get reliable results, you need to use `atomic operations`. Here's the correct way to do so:

_DO THIS INSTEAD_:

```javascript
 hull.traits({ coconuts: { operation: 'inc', value: 1 } })
```

Where:
- Operation: `inc`, `dec`, `setIfNull`
- Value: The value to either increment, decrement or set if nothing else was set before.

### Limitations

The Platform refuses to store Domains in accounts with a domain being a Generic Email Domain - See the list of email domains we refuse here: https://github.com/smudge/freemail/tree/master/data  - This helps preventing accounts with thousands of users under domains like `gmail.com` because you'd have written the following code:


## Utility Methods
The processor provides the following methods to help you:

| **Function Name**                                  | **Description**                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `isInAccountSegment(<name>)`                              | Returns `true` if the account is in the segment with the specified name; otherwise `false`. Please note that the name is case-sensitive.                                                                                                                                                  |
| `enteredAccountSegment(<name>)`                              | Returns the segment object if the account just entered the segment with the specified name; otherwise `null`. Please note that the name is case-sensitive.                                                                                                                                                  |
| `leftAccountSegment(<name>)`                              | Returns the segment object if the account just left the segment with the specified name; otherwise `null`. Please note that the name is case-sensitive.                                                                                                                                                  |

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
