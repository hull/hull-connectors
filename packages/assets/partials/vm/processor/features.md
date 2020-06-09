## Features

The <%connector_name%> allows your team to write Javascript and transform data in Hull for <%=users?"Users":""%><%=(users&&accounts)?" and ":""%><%=accounts?"Accounts":""%><%=users?"You can emit events based of attribute changes or calculate a lead score, ":". "%> The Processor is your multi-tool when it comes to data in Hull.

The Processor can `add traits`, `update traits` <%=users ? "and `create events`":""%> for <%=users?"Users":""%><%=(users&&accounts)?" and ":""%><%=accounts?"Accounts":""%>. <%=users?"Furthermore it allows you to `link accounts` And add/remove `aliases` for users":""%>

You can use the `superagent` library ([https://github.com/visionmedia/superagent](https://github.com/visionmedia/superagent)) to call external services or send data to webhooks.

Async/await and ES6 are supported by the connector, allowing you to write elegant code.