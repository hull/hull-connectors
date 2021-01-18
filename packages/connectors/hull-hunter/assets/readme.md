# Hunter.io

This connector currently supports hunter.io Email Finder feature. Which allows to find email address of a person based on 2 data points - person's name and company domain or name. As a result it allows to obtain this identifier for Hull User Profile in order to process it in other tools or merge/unify with existing user profile.

**IMPORTANT:** this is BETA connector and may contain major bugs, use with caution on safe data first. Consider pausing the connector and running it manually before enabling automatic flow.

## Getting Started

In order to authorize the Connector go to https://hunter.io/api-keys url and copy the API key.

Then paste it in the connector settings in Credentials section.

Next decide which Users should be processed by the connector.

**IMPORTANT:** connector will attempt to call hunter.io API and find email address for any User even if the User already have email address. It's filter settings responsibility to correctly segment Users for this connector. On the other hand this allows to rerun the logic again.
Also, it will process users not matter if `hunter/enriched_at` is set or not, or what value it has. It's also segments filter responsibility to exclude users who were previously enriched by this connector.

The last required step of configuration is to decide what is the mapping between Hull attributes and hunter.io params.

Once this is all done connector is fully operational and if active it will start to continuously call hunter.io API with users entering or being updated within whitelisted segments and store back returned email addresses.


## Reference

Hunter.io API endpoint connector use:

https://api.hunter.io/v2/email-finder

(Hunter.io documentation)[https://hunter.io/api-documentation/v2#email-finder]


Depending on the setup connector will send out following params to this endpoint:

- first_name (required)
- last_name (required)
- domain (required if company is not mapped)
- company (required if domain is not mapped)

Once response from hunter.io is obtained and returned score is above 90 the connector will save email address to the user profile, additionally it will store following attributes:

- hunter/enriched_at
- hunter/email
- hunter/score