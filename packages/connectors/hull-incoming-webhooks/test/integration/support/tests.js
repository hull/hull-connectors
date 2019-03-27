const STANDARD_EVENT_PROPS = {
  source: "incoming-webhook",
  ip: "0",
  referer: null
};
const claimsFactory = ({ type = "user", claims }) => ({
  [`io.hull.as${type === "user" ? "User" : "Account"}`]: claims,
  "io.hull.subjectType": type
});
const identify = ({ type, claims, attributes }) => ({
  type: "traits",
  claims: claimsFactory({ type, claims }),
  body: attributes
});
const track = ({ type, claims, event, properties }) => ({
  type: "track",
  claims: claimsFactory({ type, claims }),
  body: {
    ...STANDARD_EVENT_PROPS,
    event,
    properties
  }
});
const link = ({ claims, accountClaims }) => ({
  body: {},
  claims: {
    ...claimsFactory({ type: "user", claims }),
    ...claimsFactory({ type: "account", claims: accountClaims })
  }
});

module.exports = [
  {
    title: "Should store Attributes on User, with support for `source`",
    code: `
    hull.asUser({
      "id": body.id
    }).identify(body.traits, { source: "my-group" });
    `,
    body: {
      id: "123",
      traits: {
        customerioid: "321"
      }
    },
    expects: [
      identify({
        type: "user",
        claims: { id: "123" },
        attributes: { "my-group/customerioid": "321" }
      })
    ]
  },
  {
    title: "Support new syntax",
    code: `
    const user = hull.asUser({ id: body.id })
    user.identify(body.traits, { source: "my-group" });
    user.track(body.event_name, body.event_props);
    const account = hull.asAccount({ id: body.account_id });
    account.identify(body.account_traits, { source: "foo" });
    const linkedAccount = user.account({ external_id: body.account_external_id });
    linkedAccount.identify(body.linked_account_traits);
    `,
    body: {
      id: "123",
      traits: {
        foo: "321"
      },
      event_name: "event_name",
      event_props: {
        property: "value"
      },
      account_id: "abc",
      account_traits: {
        accountFoo: "accountBar"
      },
      account_external_id: "external",
      linked_account_traits: {
        linkedAccountFoo: "linkedAccountBar"
      }
    },
    expects: [
      identify({
        type: "user",
        claims: { id: "123" },
        attributes: { "my-group/foo": "321" }
      }),
      track({
        type: "user",
        claims: { id: "123" },
        event: "event_name",
        properties: { property: "value" }
      }),
      identify({
        type: "account",
        claims: { id: "abc" },
        attributes: { "foo/accountFoo": "accountBar" }
      }),
      identify({
        type: "account",
        claims: { external_id: "external" },
        attributes: { linkedAccountFoo: "linkedAccountBar" }
      }),
      link({
        claims: { id: "123" },
        accountClaims: { external_id: "external" }
      })
    ]
  },
  {
    title: "Should support legacy syntax",
    code: `
    const user = hull.user({ id: body.id })
    user.traits(body.traits, { source: "my-group" });
    user.track(body.event_name, body.event_props);
    const account = hull.account({ id: body.account_id });
    account.traits(body.account_traits, { source: "foo" });
    const linkedAccount = user.account({ external_id: body.account_external_id });
    linkedAccount.traits(body.linked_account_traits);
    `,
    body: {
      id: "123",
      traits: {
        foo: "321"
      },
      event_name: "event_name",
      event_props: {
        property: "value"
      },
      account_id: "abc",
      account_traits: {
        accountFoo: "accountBar"
      },
      account_external_id: "external",
      linked_account_traits: {
        linkedAccountFoo: "linkedAccountBar"
      }
    },
    expects: [
      identify({
        type: "user",
        claims: { id: "123" },
        attributes: { "my-group/foo": "321" }
      }),
      track({
        type: "user",
        claims: { id: "123" },
        event: "event_name",
        properties: { property: "value" }
      }),
      identify({
        type: "account",
        claims: { id: "abc" },
        attributes: { "foo/accountFoo": "accountBar" }
      }),
      identify({
        type: "account",
        claims: { external_id: "external" },
        attributes: { linkedAccountFoo: "linkedAccountBar" }
      }),
      link({
        claims: { id: "123" },
        accountClaims: { external_id: "external" }
      })
    ]
  },
  {
    title: "Should store Events and Attributes on User",
    code: `
        hull.asUser({ "id": body.id }).identify(body.traits);
        hull.asUser({ "id": body.id }).track(body.event_name, body.event_props);
      `,
    body: {
      id: "123",
      event_name: "test",
      event_props: {
        foo: "bar"
      },
      traits: {
        customerioid: "4567"
      }
    },
    expects: [
      identify({
        type: "user",
        claims: { id: "123" },
        attributes: {
          customerioid: "4567"
        }
      }),
      track({
        type: "user",
        claims: { id: "123" },
        event: "test",
        properties: {
          foo: "bar"
        }
      })
    ]
  },
  {
    title: "Should store Attributes on Account",
    code: `
      hull.asAccount({ external_id: body.id }).identify(body.traits)
  `,
    body: {
      id: "123",
      traits: {
        customerioid: "4567"
      }
    },
    expects: [
      identify({
        type: "account",
        claims: { external_id: "123" },
        attributes: { customerioid: "4567" }
      })
    ]
  },
  {
    title: "Should support nullifying values",
    code: `
      hull.asAccount({ external_id: body.id }).identify({ foo: null, bar: body.bar })
  `,
    body: {
      id: "123",
      bar: "baz"
    },
    expects: [
      identify({
        type: "account",
        claims: { external_id: "123" },
        attributes: { foo: null, bar: "baz" }
      })
    ]
  },
  {
    title: "Should properly store multiple calls",
    code: `
      const user = hull.asUser({ id:body.id });
      user.traits({ foo: body.foo })
      user.traits({ foo: body.bar })
  `,
    body: {
      foo: "foo",
      bar: "bar",
      id: "123"
    },
    expects: [
      identify({
        type: "user",
        claims: { id: "123" },
        attributes: {
          foo: "foo"
        }
      }),
      identify({
        type: "user",
        claims: { id: "123" },
        attributes: {
          foo: "bar"
        }
      })
    ]
  }
];
