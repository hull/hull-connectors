# Hull Slack Connector

This Connector adds a Bot (@hull) to your Slack Team. The Bot can:

- Notify a channel or a Slack User when a Hull User enters or leaves specific segments
- Notify a channel or a Slack User when a Hull User performs certain events.
- Search for any user in the Hull database and return it.
- Add buttons that set values (like `send_emails` for instance) on a user, opening the door to triggered actions directly from Slack.

*Note: Private Channels and Groups aren't supported for the moment*

#### Data

The Bot can return either all available data for users or a set of whitelisted properties picked from their profile. 
In the settings tab, if you leave the box blank then all properties will be returned.

The Bot can send messages on an event occurrence. There are two types of events that can be triggered - 
those occurring on the user segment and those occurring in the user segment. Events on a user segment include a user 
entering or leaving a segment. For these the events, the field 'User Filtered Segment' is used to define the segment 
that the user either moves into for the event "Entered User Segment" or the user moves out of for the event "Left User Segment". 
Events in a user segment are all other events. For these events, the user must be in the defined 'User Filtered Segment' 
segment in order for the message to be sent by the bot. All other segments will be ignored. 

In Slack, you can toggle between User Attributes and their latest events by clicking the buttons at the footer of each user profile.

####  To install:

- Click the "Connect to Slack" button on the Dashboard page,
- Authorize Slack to access your account.
- You should see green checkboxes on both "Slack credentials saved" and "Slack Bot online"

#### Usage

To get in-app help:
- Invite `@hull` to a channel and type `@hull help`.
- Start a private conversation with `@hull` and simply type `help`

#### Conversations

- `@hull user@example.com`

> get data for the user with this email. You can filter what's displayed from the Connector's settings tab in your dashboard_

- `@hull user@example.com full` 

> get full data for the user with this email. Shows the entire profile_
> returns everything even if the Settings specify which fields to return.

- `@hull user@example.com <intercom>` 

> get data in the `intercom` group for the user with this email. Replace with the service you want to display

- `@hull events user@example.com` 

> get latest events for the user with this email_

- `@hull help`

> Here to help!

#### Buttons

In the Slack Connector settings screen, you can add up to 3 buttons that will set a value on the User. You can use this to create `Enable Emails` and `Disable Emails` toggles for instance.
