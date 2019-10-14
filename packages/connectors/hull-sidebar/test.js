/* global body, hull */
const { email, account_id, foo, external_id } = body;

const applyTraits = client => {
  client.traits({ foo });
  client.traits({ foo }, { source: "bar" });
  client.traits({ "baz/foo": foo });
  client.traits({ "baz/null": null });
};
const applyTracks = client => {
  client.track("New Event", { foo });
};
const applyAccountTraits = (client, aid) => {
  const account = aid ? client.account({ external_id: aid }) : client.account();
  applyTraits(account);
};
const applyLinks = client => {
  client.track("New Event", { foo });
};
const run = (client, aid) => {
  applyTraits(client);
  applyTracks(client);
  applyAccountTraits(client, aid);
  applyLinks(client);
};

// Classic User
const classicUser = hull.asUser({ email });
run(classicUser, account_id);

// Second User
const secondUser = hull.asUser({ email: `test-${email}` });
run(secondUser, account_id);

// external_id User
const eidUser = hull.asUser({ external_id });
run(eidUser, account_id);

// external_id and email User
const emailEidUser = hull.asUser({ external_id, email });
run(emailEidUser, account_id);

// Old Syntax
const oldSyntaxUser = hull.asUser({ email: `old-${email}` });
run(oldSyntaxUser, account_id);
