# Hull Incoming Webhooks

Run code to update User Properties and generate Events whenever Users are send to connector by webhooks.

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-incoming-webhooks)

End-Users: [See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-incoming-webhooks.herokuapp.com)

---

### Usage

- Go to your `Hull Dashboard > Ships > Add new`
- Paste the URL for your Heroku deployment, or use ours : `https://hull-incoming-webhooks.herokuapp.com/`

For further information, see [Instructions](/assets/README.md).

### Logs

The following log messages are specific to this Connector :

- incoming.account.link.error - logged when encountered errors during account linking
- incoming.account.link.success - logged after successful linking for account
- compute.console.log - these are additional logs that should be displayed after compute
- compute.user.debug - every user/account update will trigger logging of user and account traits that are going to be updated
- connector.request.data - logs the raw payload received as webhook

For all general log messages, see the hull-node documentation.

### Status

- `Settings are empty` - `error` - returned when we have no script code saved in the settings
- `Settings are referencing invalid values` - `error` - returned when we have a script with syntax error