// @flow
module.exports.jsonHandler = require("./json-handler/factory");
module.exports.batchHandler = require("./batch-handler/factory");
module.exports.notificationHandler = require("./notification-handler/factory");
module.exports.oAuthHandler = require("./oauth-handler/factory");
module.exports.queueHandler = require("./queue-handler/factory");
module.exports.incomingRequestHandler = require("./incoming-request-handler/factory");
module.exports.scheduleHandler = require("./schedule-handler/factory");
module.exports.htmlHandler = require("./html-handler/factory");

// module.exports.statusHandler = require("./status-handler");
