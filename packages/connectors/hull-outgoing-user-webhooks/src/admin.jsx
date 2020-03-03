import renderApp from "hull-webhooks/src/app";

const VALID = `Valid identifiers are:
- external_id
- anonymous_id
- email
- Hull ID`;

renderApp({
  empty: `Please enter the identifier of a User in the field above.
  ${VALID}`,
  notFound: `We couldn't find a matching User.
  Did you use the right identifiers?

  ${VALID}`,
  title: "Enter Email or ID to fetch User"
});
