## Code basics

You can access the **input data** as described above, here is the summary of available Javascript objects:

| Variable Name                      | Description                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `changes`                          | Represents all changes in attributes and segments since the last re-computation.       |
| `account`                          | Provides access to the account’s attributes.                                   |
<% if (users) { %>| `user`                             | Provides access to the user’s attributes.                                      |
| `events`                           | Gives you access to all events **since the last re-computation.**              |
| `segments`                         | Provides a list of all segments the user belongs to                            |
<% } %>| `account_segments`                 | Provides a list of all account segments the <%=users?"user's Account ":""%>belongs to      |

Please note that some of the input data shown on the left might be fake data that showcases additional fields available in your organization but that might not be applicable to all users.

In addition to the input, you can also access the **settings** of the processor:

|**Variable Name**| **Description**                                                                                                                                                |
|-----------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`connector`           | Provides access to processor settings, e.g. `connector.private_settings` gives you access to the settings specified in `manifest.json` as shown in the Advanced tab.|
|`variables`           | Provides the values that you can store in the `Settings` tab of the connector. Usually to avoid storing Access Keys in the code itself |

Now that you have a good overview of which variables you can access to obtain information, let’s move on to the functions that allow you to **manipulate data**.
