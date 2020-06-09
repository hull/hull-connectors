## Input - User

The `user` object provides you access to all attributes of the currently computed user. You have access to three different kinds of attributes, top-level, ungrouped and grouped traits.

Top-level attributes are directly accessible via `user.name` for example, grouped attributes can be used via `user.salesforce_contact.email`. Be careful to check for the group's existence if you're accessing them. We recommend using `lodash` for this: `_.get(user, "salesforce_contact.email")` for instance.

You can inspect the user object shown in the Input (left column) to inspect the different attributes of the user. You can search for a particular user in the Input by entering the email address or Hull ID into the search field.

### User Attributes:
```javascript
<%-include("../fixtures/user_report.json");%>
```
