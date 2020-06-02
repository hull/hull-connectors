### Incrementing and decrementing values (Atomic Operations)

Given the distributed nature of computation, if you want to increment or decrement a counter, you need to take special care. Since the code might run multiple times in parallel, the following operation will not be reliable:

_DO NOT DO THIS_:

```javascript
  hull.traits({ coconuts: user.coconuts+1 });
```

To get reliable results, you need to use `atomic operations`. Here's the correct way to do so:

_DO THIS INSTEAD_:

```javascript
 hull.traits({ coconuts: { operation: 'inc', value: 1 } })
```

Where:
- Operation: `inc`, `dec`, `setIfNull`
- Value: The value to either increment, decrement or set if nothing else was set before.
