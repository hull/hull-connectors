const expect = require("expect");

expect.extend({
  whatever() {
    return {
      pass: true,
      message: ""
    };
  }
});

const STANDARD_EVENT_PROPS = {
  event_id: expect.whatever(),
  source: "incoming-webhooks",
  referer: null,
  url: null,
  ip: "0"
};
const claimsFactory = ({ subjectType = "user", claims }) => ({
  [`as${subjectType === "user" ? "User" : "Account"}`]: claims,
  subjectType
});
const identify = ({ subjectType, claims, attributes }) => [
  "traits",
  claimsFactory({ subjectType, claims }),
  attributes
];
const track = ({ subjectType, claims, event, properties }) => [
  "track",
  claimsFactory({ subjectType, claims }),
  {
    ...STANDARD_EVENT_PROPS,
    event,
    properties
  }
];
const link = ({ claims, accountClaims }) => [
  "traits",
  {
    ...claimsFactory({ subjectType: "user", claims }),
    ...claimsFactory({ subjectType: "account", claims: accountClaims })
  },
  {}
];
const platformApiCalls = [
  ["GET", "/api/v1/app", {}, {}],
  [
    "GET",
    "/api/v1/users_segments?shipId=9993743b22d60dd829001999",
    { shipId: "9993743b22d60dd829001999" },
    {}
  ],
  [
    "GET",
    "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999",
    { shipId: "9993743b22d60dd829001999" },
    {}
  ]
];

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
    logs: [
      [
        "debug",
        "connector.request.data",
        {},
        {
          body: {
            id: "123",
            traits: {
              customerioid: "321"
            }
          },
          method: "POST",
          params: {},
          query: {}
        }
      ],
      [
        "debug",
        "compute.debug",
        {},
        {
          logs: [],
          logsForLogger: [],
          errors: [],
          userTraits: [[{ id: "123" }, { "my-group/customerioid": "321" }]],
          accountTraits: [],
          accountLinks: [],
          accountAliases: [],
          userAliases: [],
          events: [],
          success: true,
          isAsync: false
        }
      ],
      [
        "info",
        "incoming.user.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          attributes: {
            "my-group/customerioid": "321"
          }
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.users", 1]
    ],
    firehoseEvents: [
      identify({
        type: "user",
        claims: { id: "123" },
        attributes: { "my-group/customerioid": "321" }
      })
    ],
    platformApiCalls
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
    logs: [
      [
        "debug",
        "connector.request.data",
        {},
        {
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
          method: "POST",
          params: {},
          query: {}
        }
      ],
      [
        "debug",
        "compute.debug",
        {},
        {
          logs: [],
          logsForLogger: [],
          errors: [],
          userTraits: [
            [
              {
                id: "123"
              },
              { "my-group/foo": "321" }
            ]
          ],
          accountTraits: [
            [
              {
                id: "abc"
              },
              {
                "foo/accountFoo": "accountBar"
              }
            ],
            [
              {
                external_id: "external"
              },
              {
                linkedAccountFoo: "linkedAccountBar"
              }
            ]
          ],
          events: [
            {
              claims: {
                id: "123"
              },
              event: {
                eventName: "event_name",
                properties: {
                  property: "value"
                },
                context: {
                  source: "incoming-webhooks"
                }
              }
            }
          ],
          accountAliases: [],
          userAliases: [],
          accountLinks: [[{ id: "123" }, { external_id: "external" }]],
          success: true,
          isAsync: false
        }
      ],
      [
        "info",
        "incoming.user.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          attributes: {
            "my-group/foo": "321"
          }
        }
      ],
      [
        "info",
        "incoming.account.success",
        {
          subject_type: "account",
          account_id: "abc"
        },
        {
          attributes: {
            "foo/accountFoo": "accountBar"
          }
        }
      ],
      [
        "info",
        "incoming.account.success",
        {
          subject_type: "account",
          account_external_id: "external"
        },
        {
          attributes: {
            linkedAccountFoo: "linkedAccountBar"
          }
        }
      ],
      [
        "info",
        "incoming.event.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          eventName: "event_name",
          properties: {
            property: "value"
          }
        }
      ],
      [
        "info",
        "incoming.account.link.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          accountClaims: {
            external_id: "external"
          },
          claims: {
            id: "123"
          }
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.users", 1],
      ["increment", "ship.incoming.accounts", 2],
      ["increment", "ship.incoming.events", 1],
      ["increment", "ship.incoming.accounts.link", 1]
    ],
    firehoseEvents: [
      identify({
        subjectType: "user",
        claims: { id: "123" },
        attributes: { "my-group/foo": "321" }
      }),
      identify({
        subjectType: "account",
        claims: { id: "abc" },
        attributes: { "foo/accountFoo": "accountBar" }
      }),
      identify({
        subjectType: "account",
        claims: { external_id: "external" },
        attributes: { linkedAccountFoo: "linkedAccountBar" }
      }),
      track({
        subjectType: "user",
        claims: { id: "123" },
        event: "event_name",
        referer: null,
        properties: { property: "value" }
      }),
      link({
        claims: { id: "123" },
        accountClaims: { external_id: "external" }
      })
    ],
    platformApiCalls
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
    logs: [
      [
        "debug",
        "connector.request.data",
        {},
        {
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
          method: "POST",
          params: {},
          query: {}
        }
      ],
      [
        "debug",
        "compute.debug",
        {},
        {
          logs: [],
          logsForLogger: [],
          errors: [],
          userTraits: [
            [
              {
                id: "123"
              },
              {
                "my-group/foo": "321"
              }
            ]
          ],
          accountTraits: [
            [
              {
                id: "abc"
              },
              {
                "foo/accountFoo": "accountBar"
              }
            ],
            [
              {
                external_id: "external"
              },
              { linkedAccountFoo: "linkedAccountBar" }
            ]
          ],
          accountAliases: [],
          userAliases: [],
          events: [
            {
              claims: {
                id: "123"
              },
              event: {
                eventName: "event_name",
                properties: {
                  property: "value"
                },
                context: {
                  source: "incoming-webhooks"
                }
              }
            }
          ],
          accountLinks: [
            [
              {
                id: "123"
              },
              {
                external_id: "external"
              }
            ]
          ],
          success: true,
          isAsync: false
        }
      ],
      [
        "info",
        "incoming.user.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          attributes: {
            "my-group/foo": "321"
          }
        }
      ],
      [
        "info",
        "incoming.account.success",
        {
          subject_type: "account",
          account_id: "abc"
        },
        {
          attributes: {
            "foo/accountFoo": "accountBar"
          }
        }
      ],
      [
        "info",
        "incoming.account.success",
        {
          subject_type: "account",
          account_external_id: "external"
        },
        {
          attributes: {
            linkedAccountFoo: "linkedAccountBar"
          }
        }
      ],
      [
        "info",
        "incoming.event.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          eventName: "event_name",
          properties: {
            property: "value"
          }
        }
      ],
      [
        "info",
        "incoming.account.link.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          accountClaims: { external_id: "external" },
          claims: { id: "123" }
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.users", 1],
      ["increment", "ship.incoming.accounts", 2],
      ["increment", "ship.incoming.events", 1],
      ["increment", "ship.incoming.accounts.link", 1]
    ],
    firehoseEvents: [
      identify({
        subjectType: "user",
        claims: { id: "123" },
        attributes: { "my-group/foo": "321" }
      }),
      identify({
        subjectType: "account",
        claims: { id: "abc" },
        attributes: { "foo/accountFoo": "accountBar" }
      }),
      identify({
        subjectType: "account",
        claims: { external_id: "external" },
        attributes: { linkedAccountFoo: "linkedAccountBar" }
      }),
      track({
        subjectType: "user",
        claims: { id: "123" },
        event: "event_name",
        properties: { property: "value" }
      }),
      link({
        claims: { id: "123" },
        accountClaims: { external_id: "external" }
      })
    ],
    platformApiCalls
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
    logs: [
      [
        "debug",
        "connector.request.data",
        {},
        {
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
          method: "POST",
          params: {},
          query: {}
        }
      ],
      [
        "debug",
        "compute.debug",
        {},
        {
          logs: [],
          logsForLogger: [],
          errors: [],
          userTraits: [
            [
              {
                id: "123"
              },
              {
                customerioid: "4567"
              }
            ]
          ],
          accountTraits: [],
          events: [
            {
              claims: {
                id: "123"
              },
              event: {
                eventName: "test",
                properties: {
                  foo: "bar"
                },
                context: {
                  source: "incoming-webhooks"
                }
              }
            }
          ],
          accountLinks: [],
          accountAliases: [],
          userAliases: [],
          success: true,
          isAsync: false
        }
      ],
      [
        "info",
        "incoming.user.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          attributes: {
            customerioid: "4567"
          }
        }
      ],
      [
        "info",
        "incoming.event.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          eventName: "test",
          properties: { foo: "bar" }
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.users", 1],
      ["increment", "ship.incoming.events", 1]
    ],
    firehoseEvents: [
      identify({
        subjectType: "user",
        claims: { id: "123" },
        attributes: {
          customerioid: "4567"
        }
      }),
      track({
        subjectType: "user",
        claims: { id: "123" },
        event: "test",
        properties: {
          foo: "bar"
        }
      })
    ],
    platformApiCalls
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
    logs: [
      [
        "debug",
        "connector.request.data",
        {},
        {
          body: {
            id: "123",
            traits: {
              customerioid: "4567"
            }
          },
          method: "POST",
          params: {},
          query: {}
        }
      ],
      [
        "debug",
        "compute.debug",
        {},
        {
          logs: [],
          logsForLogger: [],
          errors: [],
          userTraits: [],
          accountTraits: [
            [
              {
                external_id: "123"
              },
              { customerioid: "4567" }
            ]
          ],
          events: [],
          accountLinks: [],
          accountAliases: [],
          userAliases: [],
          success: true,
          isAsync: false
        }
      ],
      [
        "info",
        "incoming.account.success",
        {
          subject_type: "account",
          account_external_id: "123"
        },
        {
          attributes: {
            customerioid: "4567"
          }
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.accounts", 1]
    ],
    firehoseEvents: [
      identify({
        subjectType: "account",
        claims: { external_id: "123" },
        attributes: { customerioid: "4567" }
      })
    ],
    platformApiCalls
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
    logs: [
      [
        "debug",
        "connector.request.data",
        {},
        {
          body: {
            id: "123",
            bar: "baz"
          },
          method: "POST",
          params: {},
          query: {}
        }
      ],
      [
        "debug",
        "compute.debug",
        {},
        {
          logs: [],
          logsForLogger: [],
          errors: [],
          userTraits: [],
          accountTraits: [
            [
              {
                external_id: "123"
              },
              {
                foo: null,
                bar: "baz"
              }
            ]
          ],
          events: [],
          accountLinks: [],
          accountAliases: [],
          userAliases: [],
          success: true,
          isAsync: false
        }
      ],
      [
        "info",
        "incoming.account.success",
        {
          subject_type: "account",
          account_external_id: "123"
        },
        {
          attributes: {
            foo: null,
            bar: "baz"
          }
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.accounts", 1]
    ],
    firehoseEvents: [
      identify({
        subjectType: "account",
        claims: { external_id: "123" },
        attributes: { foo: null, bar: "baz" }
      })
    ],
    platformApiCalls
  },
  {
    title: "Should properly store multiple calls",
    code: `
      const user = hull.asUser({ id: body.id });
      user.traits({ foo: body.foo })
      user.traits({ foo: body.bar })
  `,
    body: {
      foo: "foo",
      bar: "bar",
      id: "123"
    },
    logs: [
      [
        "debug",
        "connector.request.data",
        {},
        {
          body: {
            foo: "foo",
            bar: "bar",
            id: "123"
          },
          method: "POST",
          params: {},
          query: {}
        }
      ],
      [
        "debug",
        "compute.debug",
        {},
        {
          logs: [],
          logsForLogger: [],
          errors: [],
          userTraits: [[{ id: "123" }, { foo: "bar" }]],
          accountTraits: [],
          accountLinks: [],
          accountAliases: [],
          userAliases: [],
          events: [],
          success: true,
          isAsync: false
        }
      ],
      [
        "info",
        "incoming.user.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          attributes: {
            foo: "bar"
          }
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.users", 1]
    ],
    firehoseEvents: [
      identify({
        subjectType: "user",
        claims: { id: "123" },
        attributes: {
          foo: "bar"
        }
      })
    ],
    platformApiCalls
  },
  {
    title: "Should properly alias and unalias Users and Accounts",
    code: `
      hull.asUser({ id: body.id }).alias({ email: "foo@bar.com" })
      const asAccount = hull.asAccount({ domain: "foo.com" })
      asAccount.alias({ external_id: "123" })
      asAccount.unalias({ anonymous_id: "nooot" })
    `,
    body: {
      id: "123"
    },
    logs: [
      [
        "debug",
        "connector.request.data",
        {},
        { body: { id: "123" }, method: "POST", params: {}, query: {} }
      ],
      [
        "debug",
        "compute.debug",
        {},
        {
          logs: [],
          logsForLogger: [],
          errors: [],
          userTraits: [],
          accountTraits: [],
          accountLinks: [],
          accountAliases: [
            [
              { domain: "foo.com" },
              [
                [{ external_id: "123" }, "alias"],
                [{ anonymous_id: "nooot" }, "unalias"]
              ]
            ]
          ],
          userAliases: [[{ id: "123" }, [[{ email: "foo@bar.com" }, "alias"]]]],
          events: [],
          success: true,
          isAsync: false
        }
      ],
      [
        "info",
        "incoming.user.alias.success",
        {
          subject_type: "user",
          user_id: "123"
        },
        {
          aliases: { 'Map { "email": "foo@bar.com" }': "alias" },
          claims: { id: "123" }
        }
      ],
      [
        "info",
        "incoming.account.alias.success",
        {
          subject_type: "account",
          account_domain: "foo.com"
        },
        {
          aliases: {
            'Map { "external_id": "123" }': "alias",
            'Map { "anonymous_id": "nooot" }': "unalias"
          },
          claims: { domain: "foo.com" }
        }
      ]
    ],
    metrics: [
      ["increment", "connector.request", 1],
      ["increment", "ship.service_api.call", 1],
      ["increment", "ship.incoming.users.alias", 1],
      ["increment", "ship.incoming.accounts.alias", 2]
    ],
    firehoseEvents: [
      [
        "alias",
        {
          asUser: {
            id: "123"
          },
          subjectType: "user"
        },
        { email: "foo@bar.com" }
      ],
      [
        "alias",
        {
          asAccount: {
            domain: "foo.com"
          },
          subjectType: "account"
        },
        { external_id: "123" }
      ],
      [
        "unalias",
        {
          asAccount: {
            domain: "foo.com"
          },
          subjectType: "account"
        },
        { anonymous_id: "nooot" }
      ]
    ],
    platformApiCalls
  }
];
