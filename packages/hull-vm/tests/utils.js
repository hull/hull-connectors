const expect = require("expect");

expect.extend({
  whatever() {
    return {
      pass: true,
      message: ""
    };
  }
});

export const STANDARD_EVENT_PROPS = {
  event_id: expect.whatever(),
  source: "code",
  referer: null,
  url: null,
  ip: "0"
};

const claimsFactory = ({ subjectType = "user", claims }) => ({
  [`as${subjectType === "user" ? "User" : "Account"}`]: claims,
  subjectType
});

export const identify = ({ subjectType, claims, attributes }) => [
  "traits",
  claimsFactory({ subjectType, claims }),
  attributes
];

export const track = ({ subjectType, claims, event, properties }) => [
  "track",
  claimsFactory({ subjectType, claims }),
  {
    ...STANDARD_EVENT_PROPS,
    event,
    properties
  }
];

export const link = ({ claims, accountClaims }) => [
  "traits",
  {
    ...claimsFactory({ subjectType: "user", claims }),
    ...claimsFactory({ subjectType: "account", claims: accountClaims })
  },
  {}
];
