# Hull Scheduled Calls

This connector enables you to perform scheduled calls to an external API and update your user and account data in Hull by writing Javascript.

## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” 
on the Scheduled Calls card. After installation, define your API calls in the Settings section and in the Code Editor on the Overview section, define how received payloads will be manipulated and sent to Hull.

After installing the connector, go into the connector Settings page. Here, enter the URL, method, call interval (in minutes), and optional headers and body.

In the code editor, you will be presented with a three column Dashboard layout. 
The left column displays the received payload from the API call, 
the middle column holds your Javascript code that transforms the input, and the right column displays the output of your code from the given input. 

To populate the input column, you can wait for the scheduled call to be executed per your configuration or you may perform a manual API call by opening the Configuration window and selecting "Call API" in either preview mode or live mode. Preview mode will not persist the output in your organization, while live mode will. Each API call, up to 100, will be stored and will be available to select as input.

In the center column, define the code that will be executed on each API call to manipulate users, accounts, and/or events. You can toggle between the current code that it is being developed and the code that was run at the time of the request. See below for tips on how to write your code.

## Features

The Scheduled Calls Connector allows you to receive data from external systems, write Javascript to transform the received data to update users and accounts in Hull, as well as emit events in Hull to track behavioral data.

Available actions that can be coded:
 - `create users/accounts`
 - `create user/account attributes`
 - `update user/account attributes`
 - `create user events`
 - `link users to accounts`

To make the Connector even more powerful, you can use the `request` library [https://github.com/request/request](https://github.com/request/request) to call external services.

## Code Basics

You can access the **request data** directly using the following variables:

| Variable Name        | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `body`               | Contains the parsed data as a `json` object.           |
| `requestBody`        | Object containing the body that was sent.              |
| `requestHeaders`     | Object containing HTTP headers.                        |
| `responseHeader`     | Object containing HTTP headers.                        |
| `url`                | The url that was called.                               |
| `method`             | A string describing the HTTP method.                   |
| `status`             | The response status code                               |
| `params`             | Object containing the route parameters of the request. |

Please note that the availability of these variables may be dependent on the external service.

#### Create or Update Users

Use the `hull.user` function to **reference an existing user** or **create a new one**.

Function signature:

```javascript
    hull.user({external_id: <value>, email: <value>})
```

It is recommended to use the `external_id` if your payload contains it or rely on the `email` as fallback option. You can pass both identifiers if they are available, but the `external_id` will always take precedence over the `email`. For the purpose of simplicity, the following code will only show the `external_id` identifier.

Set ***top-level and ungrouped attributes***:

```javascript
    hull.user({external_id: <value>}).traits({ ATTRIBUTE_NAME: <value> })
```

Set multiple attributes at once by passing in an object of attributes:

```javascript
    hull.user({external_id: <value>}).traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

By default attributes are stored in the `traits` attributes group.
To group the attributes in a custom group, pass the group name as source in the second parameter:

```javascript
    hull.user({external_id: <value>}).traits({ ATTRIBUTE_NAME: <value> }, { source: <group_name> })
```

Or provide the group name per attribute:

```javascript
    hull.user({external_id: <value>}).traits({ GROUP_NAME/ATTRIBUTE_NAME: <value> })
```

To delete an attribute:

```javascript
    hull.user({external_id: <value>}).traits({ ATTRIBUTE_NAME: null })
```


#### Create or Update Accounts

Use the `hull.account` function to **reference an existing account** or **create a new one**.

Function signature:

```javascript
    hull.account({external_id: <value>, domain: <value>})
```

It is recommended to use the `external_id` if your payload contains it or rely on the `domain` as fallback option. You can pass both identifiers if they are available, but the `external_id` will always take precedence over the `domain`. For the purpose of simplicity, the following code will only show the `external_id` identifier.

Set ***top-level and ungrouped attributes***:

```javascript
    hull.account({external_id: <value>}).traits({ ATTRIBUTE_NAME: <value> })
```

Set multiple attributes at once by passing in an object of attributes:

```javascript
    hull.account({external_id: <value>}).traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

By default, non top level attributes are stored in the `traits` attributes group.
To group the attributes in a custom group, pass the group name as source in the second parameter:

```javascript
    hull.account({external_id: <value>}).traits({ ATTRIBUTE_NAME: <value> }, { source: <group_name> })
```

Or provide the group name per attribute:

```javascript
    hull.account({external_id: <value>}).traits({ GROUP_NAME/ATTRIBUTE_NAME: <value> })
```

To delete an attribute:

```javascript
    hull.account({external_id: <value>}).traits({ ATTRIBUTE_NAME: null })
```


#### Emit Events

Use the `hull.track` function to emit events. Note that there is 10 track call limit per received API call.

Function signature:

```javascript
    hull.user({external_id: <value>}).track( "<event_name>" , { PROPERTY_NAME: <value>, PROPERTY2_NAME: <value> })
```

The first parameter is a string defining the name of the event while the second parameter is an object that defines the properties of the event.

#### Link Users to Accounts

Use the `hull.account` function to link users to accounts. Provide the claims, `domain`, `id` and/or `external_id` of the account.

Function signature:

```javascript
    hull.user({external_id: <value>}).account({ domain: <value> })
```

## External Libraries

The Connector exposes several external libraries that can be used:

| Library    | Description
| ---------- | ------------------------------------------------------------------ |
| `_`        | The lodash library. [https://lodash.com/](https://lodash.com/)     |
| `moment()` | The Moment.js library. [https://momentjs.com/](https://momentjs.com/) |
| `urijs()`  | The URI.js library. [https://github.com/medialize/URI.js/](https://github.com/medialize/URI.js/) |


## Golden Rules

- DO use snake_case rather than camelCase in your naming.
- DO write human readable keys for traits. Don’t use names like `ls` for lead score, just name it `lead_score`.
- DO use `_at` or `_date` as suffix to your trait name to let hull recognize the values as valid dates. You can pass either
  - a valid unix timestamp in seconds or milliseconds or
  - a valid string formatted according to ISO-8601
- DO make sure that you use the proper type for new traits because this cannot be changed later. For example, if you pass `"1234"` as the value for trait `customerId`, the trait will be always a treated as string, even if you intended it to be a number.
- DO NOT write code that generates dynamic keys for traits
- DO NOT use large arrays because they are slowing down the compute performance of your data. Arrays with up to 50 values are okay.

## Debugging and Logging

When operating you might want to log certain information so that it is available for debugging or auditing purposes while other data might be only of interest during development. The processor allows you to do both:

- `console.log` is used for development purposes only and will display the result in the console of the user interface but doesn’t write into the operational logs.
- `console.info` is used to display the result in the console of the user interface and does also write an operational log.

You can access the operational logs via the tab “Logs” in the user interface. The following list explains the various log messages available:

| **Message**                     | **Description**                                                          |
| ------------------------------- | ------------------------------------------------------------------------ |
| `compute.console.log`           | The manually logged information via `console.info`.                      |
| `compute.user.debug`            | Logged when the computation of a user is started.                        |
| `incoming.user`                 | Logs the payload                                                         |
| `incoming.user.success`         | Logged after attributes of a user have been successfully computed.       |
| `incoming.user.skip`            | Logged if the user hasn’t changed and there is no computation necessary. |
| `incoming.account.success`      | Logged after attributes of an account have been successfully computed.   |
| `incoming.account.link.success` | Logged after the user has been successfully linked with an account.      |
| `incoming.account.link.error`   | Logged when an error occurred during linking a user to an account.       |
| `incoming.user.error`           | Logged if an error is encountered during compute.                        |
