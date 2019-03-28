// @flow

import Hull from "hull";
import routes from "./routes";
import config from "./config";

const connector = new Hull.Connector(config()).start();
