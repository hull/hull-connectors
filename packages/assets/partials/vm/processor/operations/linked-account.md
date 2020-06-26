## How to edit attributes for the account

To **change attributes for an account**, you can use the chained function call `hull.account(CLAIMS_OBJECT).traits()`. If the user is already linked to an account, you can skip passing the claims object in the `hull.account(CLAIMS_OBJECT)`  function and the attributes will be applied to the current linked account. By specifying the claims, you can explicitly address the account and if it is not linked to the current user, the account will be linked and attributes will be updated.
In contrast to the user, accounts do only support top-level attributes. You can specify the attributes in the same way as for a user by passing an object into the chained `traits` function like

> NOTE: be careful when doing this as every User in the account will be sent to the processor, and will run this logic. You could easily end up with infinite loop where each User updates the same Account back and forth, with different values. A better way to update account data is to use the Accounts processor.

```js
  const accountExternalId = account.external_id.
  const accountDomain = account.domain.
  hull
    .account({ domain: accountDomain, external_id: accountExternalId })
    .traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```
