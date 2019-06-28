# Hull Clearbit Ship.

Enrich customer profiles using [Clearbit](https://clearbit.com)

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-clearbit)

End-Users: [See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-clearbit.herokuapp.com)
---

### Using :

- Go to your `Hull Dashboard > Connectors > Add new`
- Paste the URL for your Heroku deployment, or use ours : `https://hull-clearbit.herokuapp.com/`
- Enter the Clearbit API Key
- Go to Clearbit and save the following webhook url: `https://hull-clearbit.herokuapp.com/clearbit`

### Developing :

- Fork
- Install

```sh
npm install -g gulp
npm install
gulp
```

### Logs :

  Logs that are specific for Clearbit Connector :
    info :
      - `incoming.user.start` - when receiving webhook from Clearbit
      - `clearbit.prospector.success` - when fetching Clearbit prospects
      - `clearbit.enrich.success` - when enriching an email address
      - `clearbit.reveal.success` - when revealing an IP address


      - `outgoing.user.skip` with `"action": "discover"`: Logged when Clearbit Enrichment is skipped. The `message` gives context on why it was skipped.
        possible params: `message`, `email`, `id`, `external_id`, `domain`, `discover_segments`
        possible `message` :
        - `"Discover not enabled"` : `Enable Discovery` is not checked in settings or the segment list to discover is empty.
        - `"No 'domain' in User. We need a domain"` : The user does not have a `clearbit/employment_domain` nor a `clearbit_company/domain`
        - `"Already discovered similar companies"`
        - `"User has no email or no last_seen_at"` : The user has never been seen or does not have an email defined.
        - `"User is himself a discovery. Prevent Loops"` : this user has been discovered by the Clearbit connector. Do not discover twice to avoid discovery loop.
        - `"User is not in a discoverable segment"`
        - `"Domain already used for discovery"` : do not use Clearbit discovery twice for the same domain.

      - `outgoing.user.skip` with `"action": "prospector"` : Logged when Clearbit Prospection is skipped. The `message` parameter gives context on why is was skipped.
        params: `message`, `email`, `id`, `external_id`, `domain`, `prospect_segments`
        possible `message` :
        - `"No domain"` : The user does not have a `clearbit/employment_domain` nor a `clearbit_company/domain`
        - `"Not in any prospectable segment"` : `Enable Prospector` is not checked in settings or the segment list to prospect is empty.
        - `"Known user. We only prospect unknown users"` : The user has an email defined.
        - `"Already prospected"` : this user has already been prospected by the Clearbit connector. Do not prospect twice to avoid prospect loop.
        - `"We already have known users with that domain"`
