#### Create or Update Users

Use the `hull.asUser()` function to **reference an existing user** or **create a new one**.

Function signature:

```javascript
hull
  .asUser({external_id: <value>, email: <value>})
```

It is recommended to use the `external_id` if your payload contains it or rely on the `email` as fallback option. You can pass both identifiers if they are available, but the `external_id` will always take precedence over the `email`. For the purpose of simplicity, the following code will only show the `external_id` identifier.

Set top-level and ungrouped attributes:

```javascript
hull
  .asUser({external_id: <value>})
  .traits({ ATTRIBUTE_NAME: <value> })
```

Set multiple attributes at once by passing in an object of attributes:

```javascript
hull
  .asUser({external_id: <value>})
  .traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

By default, non top-level attributes are stored in the `traits` attributes group.
To group the attributes in a custom group, pass the group name as source in the second parameter:

```javascript
hull
  .asUser({external_id: <value>})
  .traits({ ATTRIBUTE_NAME: <value> }, { source: <group_name> })
```

Or provide the group name per attribute:

```javascript
hull
  .asUser({external_id: <value>})
  .traits({ GROUP_NAME/ATTRIBUTE_NAME: <value> })
```

To delete an attribute:

```javascript
hull
  .asUser({external_id: <value>})
  .traits({ ATTRIBUTE_NAME: null })
```

#### Create or Update Accounts

Use the `hull.asAccount` function to **reference an existing account** or **create a new one**.

Function signature:

```javascript
hull.asAccount({external_id: <value>, domain: <value>})
```

It is recommended to use the `external_id` if your payload contains it or rely on the `domain` as fallback option. You can pass both identifiers if they are available, but the `external_id` will always take precedence over the `domain`. For the purpose of simplicity, the following code will only show the `external_id` identifier.

Set top-level and ungrouped attributes:

```javascript
hull
  .asAccount({external_id: <value>})
  .traits({ ATTRIBUTE_NAME: <value> })
```

Set multiple attributes at once by passing in an object of attributes:

```javascript
hull
  .asAccount({external_id: <value>})
  .traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

By default, non top-level attributes are stored in the `traits` attributes group.
To group the attributes in a custom group, pass the group name as source in the second parameter:

```javascript
hull
  .asAccount({external_id: <value>})
  .traits({ ATTRIBUTE_NAME: <value> }, { source: <group_name> })
```

Or provide the group name per attribute:

```javascript
hull
  .asAccount({external_id: <value>})
  .traits({ GROUP_NAME/ATTRIBUTE_NAME: <value> })
```

To delete an attribute:

```javascript
hull
  .asAccount({external_id: <value>})
  .traits({ ATTRIBUTE_NAME: null })
```


