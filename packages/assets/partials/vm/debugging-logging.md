## Debugging and Logging

When operating you might want to log certain information so that it is available for debugging or auditing purposes while other data might be only of interest during development. The processor allows you to do both:

- `console.log` is used for development purposes only and will display the result in the console of the user interface but doesn’t write into the operational logs.
- `console.info` is used to display the result in the console of the user interface and does also write an operational log.

You can access the operational logs via the tab “Logs” in the user interface. The following list explains the various log messages available:

| **Message**                | **Description**                                                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compute.console.info`     | The manually logged information via `console.info`.                                                                                                                                                                           |
| `compute.user.debug`       | Logged when the computation of a user is started.                                                                                                                                                                             |
<% if(users){ %>| `incoming.user.success`    | Logged after attributes of a user have been successfully computed.                                                                                                                                            |
| `incoming.user.error`      | Logged if an error is encountered during compute. The data of the error provides additional information whether the error occurred in the sandboxed custom code or in the processor itself (see boolean value for `sandbox`). |
| `incoming.user.skip`            | Logged if the user hasn’t changed and there is no computation necessary. |
| `incoming.account.link.success` | Logged after the user has been successfully linked with an account.      |
| `incoming.account.link.error`   | Logged when an error occurred during linking a user to an account.       |<% } %>
<% if(accounts){ %>| `incoming.account.success` | Logged after attributes of an account have been successfully computed.                                                                                                                                     |<% } %>