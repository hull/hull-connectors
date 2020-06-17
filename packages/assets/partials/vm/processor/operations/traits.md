## How to set <%=users?"User":""%> <%=(users&&accounts)?" / ":""%> <%=accounts?"Account":""%> attributes

Lets first explore how you can **change attributes for <%=entity%>s**. As you already know from the section above, there are three types of attributes, top-level, ungrouped and grouped attributes. ***Top-level and ungrouped attributes*** can be set with the not-overloaded function call

```javascript
hull.traits({ ATTRIBUTE_NAME: <value> })
```

For naming conventions, see the Golden Rules section below.

Of course you can set multiple attributes at once by passing a more complex object like:

```javascript
hull.traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

Using this function signature, these attributes are stored at the top level for the target <%entity%> <%users?"(or Account)":""%>

### Attribute Groups

If you want to make use of ***grouped attributes***, you can use the overloaded signature of the function, passing the group name as source in the second parameter:

```javascript
hull.traits({ bar: "baz" }, { source: "foo" })
```

Alternatively, you can pass the fully qualified name for the grouped attribute. Those two signatures will have the same results

```javascript
hull.traits({ "foo/bar": baz });
```

If you want to “delete” an attribute, you can use the same function calls as described above and simply set `null`  as value.

```javascript
hull.traits({ foo: null });
```
