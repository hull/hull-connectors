// @flow

/*
  Parses current request from Segment. Stores the message in req.segment.message;
*/
export function parseRequest(req, res, next) {
  req.segment = req.segment || {};
  req.segment.body = req.body;
  req.segment.message = req.body;
  return next();
}

/*
  Parses current request from Segment. Stores the token from req.headers into req.hull.token
*/
export function fetchToken(req, res, next) {
  req.hull = req.hull || {};
  if (req.headers.authorization) {
    const [authType, token64] = req.headers.authorization.split(" ");
    if (authType === "Basic" && token64) {
      try {
        req.hull.token = Buffer.from(token64, "base64")
          .toString()
          .split(":")[0]
          .trim();
        req.hull.config = false;
      } catch (err) {
        const e = new Error("Invalid Basic Auth Header");
        e.status = 401;
        return next(e);
      }
    }
  }
  return next();
}
