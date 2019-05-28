# Hull Slack Connector

This Connector adds a Bot (@hull) to your Slack Team. The Bot can:

- Notify a channel or a Slack User when a Hull User enters or leaves specific segments.
- Notify a channel or a Slack User when a Hull User performs certain events.
- Notify a channel or a Slack User when a Hull Account enters or leaves specific segments.

#### Data

To setup the bot, create one or more conditions that trigger slack notifications.
For each notification, you can pick the channel or user to notify, and the content of the message.
To compose the message, you're allowed to use the (Liquid templating language)[https://shopify.github.io/liquid/] - This allows you to create dynamic messages. The fields at your disposal are:

- user: All user Attributes.
- account: All Account Attributes.
- event: The event that triggered the notification (with it's properties).
- segment: The segment that triggered the notification.
- account_segments: All the Segments that the Accounts belongs to.
- segments: All the Segments that the user belongs to.

The full payload for each object is documented in the (Hull Documentation)[https://www.hull.io/docs/data_lifecycle/notify/#format-of-a-user-update-notification] - Here's a sample:

```json
{
  "user": {
    "email": "foo@bar.com",
    ...
    "clearbit/employment_role": "ceo"
  },
  "account": {
    "domain": "bar.com",
    "clearbit/name": "The Bar Company"
  },
  "event": {
    "event": "Viewed a page"
  },
  "segment": {
    "name": "Important People"
  },
  "segments": [...],
  "account_segments": [...]
}
```

__NOTE__ You should OMIT the `traits_` prefix while writing your queries. This prefix is on the path to being deprecated.

DO NOT write `{{user.traits_clearbit/employment_role}}`, DO write `{{user.clearbit/employment_role}}`

With this, you could compose a liquid message such as:

```liquid
Hey, User with email {{user.email}} (
  {{user.traits_clearbit/employment_role}}
  at {{account.clearbit/name}}: {{account.domain}}
) just {{event.event}}.
He's in segment "{{segment.name}}".
```

Result: 

> Hey, User with email foo@bar.com (
  ceo at The Bar Company: bar.com
  ) just Viewed a page.
  He's in segment "Important People"



####  To install:

- Click the "Connect to Slack" button on the Dashboard page,
- Authorize Slack to access your account.
- You should see the Team ID show up in green. If that's not the case, start over.
