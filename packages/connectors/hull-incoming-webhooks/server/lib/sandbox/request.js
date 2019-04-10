// @flow
import request from "request";

export default function buildRequest(result: Result): any => any {
  return (opts, callback) => {
    result.isAsync = true;
    return request.defaults({ timeout: 3000 })(
      opts,
      (error, response, body) => {
        try {
          if (callback) {
            callback(error, response, body);
          } else {
            throw new Error("Method has no callback defined");
          }
        } catch (err) {
          result.errors.push(err.toString());
        }
      }
    );
  };
}
