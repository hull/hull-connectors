<% connector_name = "Scheduled Calls" %>
<% users = true %>
<% accounts = true %>
# Hull <%=connector_name%>

The <%=connector_name%> connector enables you to perform scheduled calls to an external API and update user and account data in Hull by writing Javascript.

<%- include("../../../assets/partials/install.md"); %>
After installation, define your API calls in the Settings section and in the Code Editor on the Overview section, define how received payloads will be manipulated and sent to Hull.
After installing the connector, go into the connector Settings page. Here, enter the URL, method, call interval (in minutes), and optional headers and body.

<%- include("../../../assets/partials/vm/recent-entries/code-editor.md"); %>

To populate the input column, you can wait for the scheduled call to be executed per your configuration or you may perform a manual API call by opening the Configuration window and selecting "Call API" in either preview mode or live mode. Preview mode will not persist the output in your organization, while live mode will. Each API call, up to 100, will be stored and will be available to select as input.

<%- include("../../../assets/partials/vm/recent-entries/features.md"); %>

<%- include("../../../assets/partials/vm/recent-entries/code-basics.md"); %>

<%- include("../../../assets/partials/vm/recent-entries/operations/traits.md"); %>

<%- include("../../../assets/partials/vm/recent-entries/operations/track.md"); %>

<%- include("../../../assets/partials/vm/recent-entries/operations/link.md"); %>

<%- include("../../../assets/partials/vm/recent-entries/operations/alias.md"); %>

<%- include("../../../assets/partials/vm/libs.md"); %>

<%- include("../../../assets/partials/vm/variables.md"); %>

<%- include("../../../assets/partials/vm/golden-rules.md"); %>

<%- include("../../../assets/partials/vm/debugging-logging.md"); %>