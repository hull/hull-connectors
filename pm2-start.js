require("@babel/register")({
  cache: false
});

const minimist = require("minimist");
const path = require("path");

const argv = minimist(process.argv);
const connector = argv.connector;
const connectorFolder = path.join(process.cwd(), connector);
const serverFolder = path.join(connectorFolder, "server");
process.chdir(connectorFolder);
require(serverFolder);
