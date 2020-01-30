# Hull Slack Connector

Sends Hull Events and Activity to [Slack](http://slack.com). Lets you search in Hull from there.

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-slack)

---

### Using :

[See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-slack.herokuapp.com)

### Development setup :

```sh
git clone git@github.com:hull-ships/hull-slack.git
cd hull-slack
yarn
npm run ngrok # Serves connector on `https://slack.eu.ngrok.io` - See `package.json` 
npm run start:dev # starts in development mode
npm run build # builds the app
npm run test # runs tests
```

### Configuring the slack app.
#### Enable and subscribe to Slack events
- Send slack events to https://your-slack-app.com/api/messages

### Logged events

Here are the events that the Slack connector tracks

- `outgoing.user.error` - Error trying to post the user to slack
- `outgoing.user.success` - User was correctly posted to a channel or member
- `outgoing.user.reply` - Bot replied to a user request
- `user.fetch.fail` - Bot failed to search for a user that was requested
- `user.fetch.success` - Bot found a user that was requested
- `bot.error` - An uncaught error happened.
- `bot.reply` - Bot replied to a user message
- `bot.hear` - Bot was mentioned and noticed it.
- `bot.interactiveMessage.post` bot detected a click on a Slack button and will reply
- `bot.interactiveMessage.error` - Bot failed fetching events for a user following a click on `Display Events`
- `bot.interactiveMessage.error` - Bot failed to update an interactive message (you update them by clicking the buttons in the User profile's footer)
- `bot.setup.start` - Bot starting setup of the channels it needs
- `bot.setup.error` - Bot failed to setup the channels it needs

# Environment variables

```sh
CLIENT_ID=:"Slack Key"
CLIENT_SECRET="Slack Secret"
SECRET="A randomly created secret. Make it long and complex"
```

Don't forget to setup your Slack dev app to allow callback URLs to your local instance as described in the `redirect_uri` section of [Slack OAuth Docs](https://api.slack.com/docs/oauth)
