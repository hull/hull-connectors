require("babel-register");
// var Hull = require('./lib/index.js');
const Hull = require("./src/index.js");

if (
  process.env.HULL_ID &&
  process.env.HULL_SECRET &&
  process.env.HULL_ORGANIZATION
) {
  const hull = new Hull({
    id: process.env.HULL_ID,
    secret: process.env.HULL_SECRET,
    organization: process.env.HULL_ORGANIZATION
  });

  hull
    .get("/org")
    .then(function(data) {
      console.log("Org Name");
      console.log(data.name);
      console.log("-------\n");
    })
    .catch(function(err) {
      console.log(err);
    });
  hull
    .get("/org/comments")
    .then(function(data) {
      console.log("Comments");
      console.log(data);
      console.log("-------\n");
    })
    .catch(function(err) {
      console.log(err);
    });

  const me = hull.asUser({ id: process.env.HULL_ME_TEST });

  me.get("/me").then(function(data) {
    console.log(`/me email for ${process.env.HULL_ME_TEST} : ${data.email}`);
    console.log("-------\n");
  });

  hull
    .post("search/user_reports", {
      query: {
        bool: {
          should: [{ term: { "email.exact": process.env.HULL_EMAIL_TEST } }],
          minimum_should_match: 1
        }
      },
      raw: true,
      page: 1,
      per_page: 1
    })
    .then(
      function searchUser(emailUser) {
        console.log(`Found: ${emailUser.data[0].name}`);
      },
      function searchUserError(err) {
        console.log("Error", err);
      }
    );

  console.log(
    hull.asUser({ external_id: "1234", email: "foo@bar.com" }).token()
  );
} else {
  console.log("Environment variables not set.");
}
