// @flow

import Hull from "hull";
import config from "./config";

const connector = new Hull.Connector(config()).start();
