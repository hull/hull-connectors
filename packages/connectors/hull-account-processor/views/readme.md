<% entity = "Account" %>
<% connector_name = "Account Processor" %>
<% user = false %>
<% account = true %>

# Hull Account Processor

The <%connector_name%> enables you to run your own logic on attributes associated to Accounts by writing Javascript.

<%- include("../../../assets/partials/install.md"); %>

After installation, you will be presented with the three column Dashboard layout. The left column displays the **Input** which is an Account with, segments and attributes, the middle column will hold your Javascript **Code** that transforms it to the **Output** of the right column. The Output itself displays the changed attributes of the account.

<%- include("../../../assets/partials/vm/getting-started.md"); %>

<%- include("../../../assets/partials/vm/features.md"); %>

<%- include("../../../assets/partials/vm/execution-model.md"); %>

<%- include("../../../assets/partials/vm/input/changes.md"); %>

<%- include("../../../assets/partials/vm/input/account.md"); %>

<%- include("../../../assets/partials/vm/input/segments/account.md"); %>

<%- include("../../../assets/partials/vm/code-basics.md"); %>

<%- include("../../../assets/partials/vm/operations/traits.md"); %>

<%- include("../../../assets/partials/vm/operations/atomic.md"); %>

<%- include("../../../assets/partials/vm/operations/alias.md"); %>

<%- include("../../../assets/partials/vm/utility.md"); %>

<%- include("../../../assets/partials/vm/libs.md"); %>

<%- include("../../../assets/partials/vm/golden-rules.md"); %>

<%- include("../../../assets/partials/vm/debug-logging.md"); %>