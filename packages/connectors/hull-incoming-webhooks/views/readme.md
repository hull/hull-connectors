<% users = false %>
<% accounts = false %>
<% connector_name = "Incoming Webhooks" %>
# Hull <%=connector_name%>

The <%=connector_name%> connector enables you to capture incoming Webhooks from an external service and update user and account data in Hull by writing Javascript.

<%- include("../../../assets/partials/install.md"); %>
After installation, open the Code Editor, copy the displayed Webhook Endpoint and paste it in your external service and define how received payloads will be manipulated and sent to Hull.

<%- include("../../../assets/partials/vm/recent-entries/code-editor.md"); %>

To populate the input column, you need to have the service emit at least one call to Hull. Each API call, up to 100, will be stored and will be available to select as input.

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