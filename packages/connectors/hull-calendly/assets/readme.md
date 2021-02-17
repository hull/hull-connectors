# Calendly Connector

The Calendly Connector receives real time events from Calendly as invitees
create, cancel, and reschedule events.

## Getting Started

In order to use the connector, go to the settings
and authorize the connector against the Hull-Calendly App.

The webhooks to receive invitee events will be automatically created and 
the connector will immediately begin to receive any subsequent meeting requests and cancellations as Hull events.


## Identity

The identity of invitees will be determined by the email entered by the invitee. This is not configurable.


## Invitee Events

**Configuration**

-  Define which Calendly Events will be fetched by the connector. By default, the connector will receive all events
available: `invitee.created` and `invitee.canceled`. Events that are rescheduled are received as these two separate events.

| **Topic**               | **Description**                 | **Connector Action**                     |
| ----------------------- | ------------------------------- | -----------------------------------------|
| invitee.created         | Invitee created a meeting       | Create a new event “invitee.created”     |
| invitee.canceled        | Invitee cancelled a meeting     | Create a new event “invitee.canceled”    |




