const fs = require("fs");
const connectors = fs.readdirSync("./dist/connectors");

if (typeof process.env.CONNECTOR !== "string" || process.env.CONNECTOR === "") {
  throw Error("CONNECTOR variable not set or empty. Should be set to `hull-*`");
}

if (connectors.indexOf(process.env.CONNECTOR) === -1) {
  throw Error(`CONNECTOR var value: ${process.env.CONNECTOR} is not a valid connector.`);
}
require(`../dist/connectors/${process.env.CONNECTOR}/server`);
