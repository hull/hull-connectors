# Calendly Connector

The Calendly connector receives real time events from Calendly as invitees
create, cancel, and reschedule events.

## Getting Started

**IMPORTANT: Calendly Premium account is required to use this integration.**

In order to use the connector, go to the settings and authorize the connector
against the Calendly API using "Log in to your Calendly account" button.

Once the connector is authorized, the webhooks to receive invitee events will be automatically created and
the connector will immediately begin to receive any subsequent meeting requests and cancellations as Hull events.


## Reference

### Identity

The identity of invitees will be determined by the email entered by the invitee. This is not configurable.


### Events

By default, the connector will receive all events available `invitee.created` and `invitee.canceled`.
Events that are rescheduled are received as these two separate events.


| **Topic**               | **Description**                 | **Connector Action**                     |
| ----------------------- | ------------------------------- | -----------------------------------------|
| invitee.created         | Invitee created a meeting       | Create a new event “invitee.created”     |
| invitee.canceled        | Invitee cancelled a meeting     | Create a new event “invitee.canceled”    |
