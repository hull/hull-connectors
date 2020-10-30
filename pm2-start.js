const minimist = require("minimist");

require("@babel/register")({
  // cwd: __dirname,
  cache: false
});
const argv = minimist(process.argv);
const connector = argv.connector;
const dir = process.cwd() + "/packages/connectors/" + connector + "/server";
process.chdir(dir);
require(dir);
