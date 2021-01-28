# Test Scenarios

## Introduction and Basic Configuration

All test scenarios are represented as sub-folders in this folder. Each scenario comes with 3 files:

- *api-response-expectations.js*: Mocks all external API calls using the `nock` library.
- *ctx-expectations.js*: Describes all expectations that should be performed against the mocked hull context (see `../helper/connector-mock.js`).
- *smart-notifier-payload.js*: Prepares the notification payload based on generic fixtures (see `../fixtures/`) that serves as input for the `SyncAgent`.

All three files need to be present for every scenario. If no external calls are expected, please create the file with the following content:

```javascript
module.exports = () => {
  // No API calls expected
};

```

You need to explicitely list the scenarios to be tested in `../sync-agent.spec.js`. There are two nested describe methods,

- *sendAccountMessages*: Used to test behavior for notifications received via the `account:update` channel
- *sendUserMessages*: Used to test behavior for notifications received via the `user:update` channel

Please modify the array `scenariosToRun` with the folder names that shall be run.

## Account:Update Scenarios

### A-1 Enrich Account

This scenario verifies that an account is properly enriched if all required account traits are present and the connector is properly configured.

**Connector Settings**

```javascript
  {
    private_settings: {
      "api_key": "abcdfghaygfai17285",
      "enabled": true,
      "sending_enabled": false,
      "synchronized_segments": [
        "59f09bc7f9c5a94af600076d"
      ]
    }
  }
```

**Expected API Calls**
The following calls against the MadKudu API should be performed:

- Exactly one `POST` call against `https://api.madkudu.com/v1/companies` with a properly formatted payload.

**Expected Hull Operations**
The following operations should be performed using hull clients:

- `hullClient.asAccount` to be called with account data exactly once
- `hullClient.asAccount.traits` to be called with `madkudu/` traits exactly once
- `hullClient.logger.debug` to be called two times, `outoing.account.start` and `connector.service_api.call`
- `hullClient.logger.info` to be called with `outgoing.account.success` exactly once
- `metric.increment` to be called two times, `ship.outgoing.account` and `ship.service_api.call`

### A-2 Skip Enrich of Account - Already Enriched

This scenario verifies that an account is not enriched another time if MadKudu traits are present and the connector is properly configured.

**Connector Settings**

```javascript
  {
    private_settings: {
      "api_key": "abcdfghaygfai17285",
      "enabled": true,
      "sending_enabled": false,
      "synchronized_segments": [
        "59f09bc7f9c5a94af600076d"
      ]
    }
  }
```

**Expected API Calls**
The following calls against the MadKudu API should be performed:

- No calls against the external API

**Expected Hull Operations**
The following operations should be performed using hull clients:

- `hullClient.asAccount` to be called with account data exactly once
- `hullClient.logger.debug` to be called with `outoing.account.start` exactly once
- `hullClient.logger.info` to be called with `outgoing.account.skip` exactly once
- `metric.increment` to be not called

### A-3 Skip Enrich of Account - No Clearbit Traits

This scenario verifies that an account is not enriched if no Clearbit traits are present and the connector is properly configured.

**Connector Settings**
```javascript
  {
    private_settings: {
      "api_key": "abcdfghaygfai17285",
      "enabled": true,
      "sending_enabled": false,
      "synchronized_segments": [
        "59f09bc7f9c5a94af600076d"
      ]
    }
  }
```

**Expected API Calls**
The following calls against the MadKudu API should be performed:

- No calls against the external API

**Expected Hull Operations**
The following operations should be performed using hull clients:

- `hullClient.asAccount` to be called with account data exactly once
- `hullClient.logger.debug` to be called with `outoing.account.start` exactly once
- `hullClient.logger.info` to be called with `outgoing.account.skip` exactly once
- `metric.increment` to be not called

### A-4 Skip Enrich of Account - Not In Segments

This scenario verifies that an account is not enriched if it is not in the whitelisted segments and the connector is properly configured.

**Connector Settings**

```javascript
  {
    private_settings: {
      "api_key": "abcdfghaygfai17285",
      "enabled": true,
      "sending_enabled": false,
      "synchronized_segments": [
        "59f09bc7f9c5a94af600076d"
      ]
    }
  }
```

**Expected API Calls**
The following calls against the MadKudu API should be performed:

- No calls against the external API

**Expected Hull Operations**
The following operations should be performed using hull clients:

- `hullClient.asAccount` to be called with account data exactly once
- `hullClient.logger.info` to be called with `outgoing.account.skip` exactly once
- `metric.increment` to be not called

### A-5 Fail to Enrich Account - Invalid API response

This scenario verifies that we log an appropriate error if the Madkudu API response is invalid and the connector is properly configured.

**Connector Settings**

```javascript
  {
    private_settings: {
      "api_key": "abcdfghaygfai17285",
      "enabled": true,
      "sending_enabled": false,
      "synchronized_segments": [
        "59f09bc7f9c5a94af600076d"
      ]
    }
  }
```

**Expected API Calls**
The following calls against the MadKudu API should be performed:

- Exactly one `POST` call against `https://api.madkudu.com/v1/companies` with a properly formatted payload.

**Expected Hull Operations**
The following operations should be performed using hull clients:

- `hullClient.asAccount` to be called with account data exactly once
- `hullClient.asAccount.traits` to not be called
- `hullClient.logger.debug` to be called two times, `outoing.account.start` and `connector.service_api.call`
- `hullClient.logger.error` to be called with `outgoing.account.error` exactly once
- `metric.increment` to be called two times, `ship.outgoing.account` and `ship.service_api.call`

### A-6 Fail to Enrich Account - API response with status 500

This scenario verifies that we log an appropriate error if the Madkudu API responds with status code 500 and the connector is properly configured.

**Connector Settings**

```javascript
  {
    private_settings: {
      "api_key": "abcdfghaygfai17285",
      "enabled": true,
      "sending_enabled": false,
      "synchronized_segments": [
        "59f09bc7f9c5a94af600076d"
      ]
    }
  }
```

**Expected API Calls**
The following calls against the MadKudu API should be performed:

- Exactly one `POST` call against `https://api.madkudu.com/v1/companies` with a properly formatted payload.

**Expected Hull Operations**
The following operations should be performed using hull clients:

- `hullClient.asAccount` to be called with account data exactly once
- `hullClient.asAccount.traits` to not be called
- `hullClient.logger.debug` to be called two times, `outoing.account.start` and `connector.service_api.call`
- `hullClient.logger.error` to be called with `outgoing.account.error` exactly once
- `metric.increment` to be called three times, `ship.outgoing.account`, `ship.service_api.call` and `connector.service_api.error`

### A-7 Skip to Enrich Account - Connector not enabled

This scenario verifies that we don't write any additional logs if the connector is disabled.

**Connector Settings**

```javascript
  {
    private_settings: {
      "api_key": "abcdfghaygfai17285",
      "enabled": false,
      "sending_enabled": false,
      "synchronized_segments": [
        "59f09bc7f9c5a94af600076d"
      ]
    }
  }
```

**Expected API Calls**
The following calls against the MadKudu API should be performed:

- No calls to be performed against external API.

**Expected Hull Operations**
The following operations should be performed using hull clients:

- No logs or metrics written or updated.

### A-8 Skip to Enrich Account - Connector has no API key configured

This scenario verifies that we don't write any additional logs if the connector has no `api_key` configured.

**Connector Settings**

```javascript
  {
    private_settings: {
      "api_key": null,
      "enabled": true,
      "sending_enabled": false,
      "synchronized_segments": [
        "59f09bc7f9c5a94af600076d"
      ]
    }
  }
```

**Expected API Calls**
The following calls against the MadKudu API should be performed:

- No calls to be performed against external API.

**Expected Hull Operations**
The following operations should be performed using hull clients:

- No logs or metrics written or updated.