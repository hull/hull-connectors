// @flow
import type { $Request } from "express";
import type { HullIncomingHandlerMessage } from "../types";
import getJsonBody from "./get-json-body";

const getMessage = (req: $Request): HullIncomingHandlerMessage => ({
  ip: req.ip,
  url: req.url,
  method: req.method,
  protocol: req.protocol,
  hostname: req.hostname,
  path: req.path,
  params: req.params,
  query: req.query,
  headers: req.headers,
  cookies: req.cookies,
  body: getJsonBody(req.body)
});

export default getMessage;
