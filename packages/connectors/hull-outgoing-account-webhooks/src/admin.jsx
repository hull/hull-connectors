import renderApp from "hull-webhooks/src/app";

const VALID = `Valid identifiers are:
- external_id
- anonymous_id
- domain
- Hull ID`;

renderApp({
  empty: `Please enter the identifier of an Account in the field above.
  ${VALID}`,
  notFound: `We couldn't find a matching Account.
  Did you use the right identifiers?

  ${VALID}`,
  title: "Enter Domain or ID to select an Account"
});
