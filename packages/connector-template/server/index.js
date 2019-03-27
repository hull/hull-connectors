// /**
//  * Main project dependencies
//  */
// import Hull from "hull";
//
// import routes from "./routes";
// import config from "./config";
//
// const connector = new Hull.Connector(config);
//
// const { MAILCHIMP_CLIENT_ID, MAILCHIMP_CLIENT_SECRET } = process.env;
//
// if (!MAILCHIMP_CLIENT_ID || !MAILCHIMP_CLIENT_SECRET) {
//   throw new Error(
//     "Can't find Mailchimp Client ID and/or Client Secret, check env vars"
//   );
// }
//
// routes(connector, {
//   clientID: MAILCHIMP_CLIENT_ID,
//   clientSecret: MAILCHIMP_CLIENT_SECRET
// });
// connector.start();
