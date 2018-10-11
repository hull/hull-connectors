const url = require("url");
const inquirer = require("inquirer");

function resolveClientCredentials(argv) {
  if (argv.url) {
    const passedUrl = url.parse(argv.url, true);
    if (
      passedUrl.query.ship &&
      passedUrl.query.secret &&
      passedUrl.query.organization
    ) {
      return Promise.resolve({
        ship: passedUrl.query.ship,
        secret: passedUrl.query.secret,
        organization: passedUrl.query.organization
      });
    }
  }
  if (
    !process.env.HULL_ID ||
    !process.env.HULL_SECRET ||
    !process.env.HULL_ORG
  ) {
    return inquirer
      .prompt([
        {
          type: "input",
          name: "HULL_ID",
          message: "CONNECTOR_ID"
        },
        {
          type: "input",
          name: "HULL_SECRET",
          message: "CONNECTOR_SECRET"
        },
        {
          type: "input",
          name: "HULL_ORG",
          message: "CONNECTOR_ORG"
        }
      ])
      .then(answers => {
        return {
          ship: answers.HULL_ID,
          secret: answers.HULL_SECRET,
          organization: answers.HULL_ORG
        };
      });
  }
  return Promise.reject(new Error("Missing connector credentials"));
}

module.exports = resolveClientCredentials;
