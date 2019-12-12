# Website connector

This connector integrates website with Hull using Hull.js library.
It allows to track the website traffic and merge it with data coming from other services.

# Installation

This connector integrates with website through a single HTML tag which enables all features.

Go to connectors settings pane first and whitelist all domains you would like to get traffic and send data back.
You can use the wildcard entry to whitelist all subdomains of specific domain.

**Example:** whitelisting \*.website.com will whitelist en.website.com, de.website.com, fr.website... etc.

Then copy the HTML tag available below the whitelist and paste it in the `\<head\>` section of your website.
You may need to refer to your website system to know how to embed the code, but below we provide guides for common systems.

[Setting up Hull.js with Google Tag Manager](https://www.hull.io/docs/guides/getting-started/setting-up-hull-js-with-google-tag-manager/)

# Tracking

Tracking of web traffic is captured by low level library Hull.js. To learn more about the internals refer [Hull.js
 reference](https://www.hull.io/docs/reference/hull_js/).

By default this connector provides basic tracking of page view events and default identity resolution.
Default tracking can be disabled in the settings of the Website connector and custom tracking can be implemented through additional javscript code deployed to the website.
Further customization capabilities are described at length in [Hull.js reference](https://www.hull.io/docs/reference/hull_js/).

To make the customization easier the connector comes with Script feature allow to quickly deploy additional javascript code, see section below to learn more.

# Scripts

Script allows to quickly deploy embedded script and external scripts to the website Hull connector is installed in. This allows to adjust the tracking plan without constant updates to the website. This is also the recommended way of deploying client-side parts of other connectors to integrate with external services not only on the back-end but also on the front-end.

## Client-side connectors

| connector | url |
| --- | --- |
| intercom | https://hull-intercom.herokuapp.com/ship.js |


## Best practises

Deploying javascript code to website when using Hull connector is easy, but it's important to keep in mind some best practises to avoid problems with front-end code.

**Wrap code in self-executing functions**
It's very easy to pollute website global namespace which leads to risk of overwriting existing variables and function names.
So it's recommended to wrap every custom code deployed to website with self-executing or self-invoking function.

```
// not wrapped code, pollutes global namespace
var foo = 'Hello';

// wrapped function, no risk of collision
(function() {
  var foo = 'Hello';
})();
```
