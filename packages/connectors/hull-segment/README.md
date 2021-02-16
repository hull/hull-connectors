
# Hull Segment Ship.

Sends Hull data to [Segment](http://segment.com).

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-segment)

End-Users: [See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-segment.herokuapp.com)
---

### Using :

- Go to your `Hull Dashboard > Ships > Add new`
- Paste the URL for your Heroku deployment, or use ours : `https://hull-segment.herokuapp.com/`
- Enter the Segment Write Key
- Visit the Setup Page (see below)
- Add your ship to a Platform.

### Developing :

- Fork
- Install

```sh
npm i -g gulp
npm i
npm run start:dev #starts in dev mode with nodemon
npm run test #runs unit tests, lints and checks dependencies
npm run watch #builds client package
npm run build # build
# Checkout package.json for more tasks
```

### Logs :

Below list presents specific log messages for Segment Connector :

  info :

    * outgoing.group.success - batch of outgoing users updated separately. It will also cause to update metric for each updated user
    * incoming.group.success - logged when successfully updated user
    * incoming.screen.success - logged on successfully screen handling
    * incoming.track.success - logged on successful track handling

  error :

    * incoming.track.error - logged when encountered error during track handling
    * incoming.group.error - logged when encountered error while updating user
    * incoming.screen.error - logged when encountered error during screen handling
