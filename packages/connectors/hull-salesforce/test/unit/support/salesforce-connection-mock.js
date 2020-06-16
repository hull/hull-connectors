const jsforce = require("jsforce");

class Connection extends jsforce.Connection {
  request(request, options, callback) {
    this.emit("request.sent", { request, options });
    const ret = super.request(request, options, callback);
    ret.then(() => {
      this.emit("request.usage", this.limitInfo.apiUsage);
    }, (error) => {
      this.emit("request.error", { request, options, error });
    });
    return ret;
  }
}

module.exports = Connection;
