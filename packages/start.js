const minimist = require("minimist");
const path = require("path");

const argv = minimist(process.argv);
const connector = argv.connector;
const connectorFolder = path.join(process.cwd(), connector, "server");
process.chdir(connectorFolder);
// eslint-disable-next-line import/no-dynamic-require
require(connectorFolder);
