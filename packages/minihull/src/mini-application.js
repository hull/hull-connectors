/* @flow */
const express = require("express");
const low = require("lowdb");
const Memory = require("lowdb/adapters/Memory");
const EventEmitter = require("events");
const bodyParser = require("body-parser");
const http = require("http");
const fs = require("fs");
const superagent = require("superagent");
const _ = require("lodash");
const Promise = require("bluebird");
const sinon = require("sinon");
const shell = require("shelljs");

/*::
export interface MiniApplicationInterface {
  app: express;
  db: low;
  requests: Object;
  server: Object;
  port: Number;
  close(): Promise;
}
*/

/**
 * Base class allowing to run simple mocking server with express and lowdb.
 * Can be extended to provide custom functionality.
 */
class MiniApplication extends EventEmitter /*:: implements MiniApplicationInterface */ {
  /*:: app: express */
  /*:: db: low */
  /*:: requests: Object */
  /*:: server: Object */
  /*:: port: Number */

  constructor() {
    super();
    // Basic dependencies
    this.app = express();
    this.db = low(new Memory());
    this.requests = low(new Memory()).setState({ incoming: [], outgoing: [] });
    this.server = http.createServer(this.app);

    // Setup Express application
    this.app.use(bodyParser.json());
    this.app.use((req, res, next) => {
      this.requests
        .get("incoming")
        .push(
          _.pick(req, "headers", "url", "method", "body", "query", "params")
        )
        .write();
      const count = this.requests.get("incoming").value().length;
      this.emit("incoming.request", req, count);
      this.emit(`incoming.request#${count}`, req, count);
      this.emit(`incoming.request@${req.url}`, req, count);
      this.emit(`incoming.request@${req.method}${req.url}`, req, count);
      next();
    });

    sinon.addBehavior("respond", this._respond);
    sinon.stub(this, "_stubMiddleware");
    this._stubMiddleware.callThrough();
    this.app.use((req, res, next) => {
      this._stubMiddleware(
        req,
        res,
        next,
        req.method,
        req.url,
        req.query,
        req.body
      );
    });
    return this;
  }

  /**
   * Sinon stub setup
   * @method respond
   */
  _respond(fake /*: Object */, arg1 /*: any */, arg2 /*: any */ = "") {
    // eslint-disable-line class-methods-use-this
    console.log("RESPOND", fake, arg1, arg2)
    if (_.isFunction(arg1)) {
      return fake.callsFake(arg1);
    }

    if (_.isNumber(arg1)) {
      return fake.callsFake((req, res) => {
        res.status(arg1).end(arg2);
      });
    }

    if (_.isObject(arg1)) {
      return fake.callsFake((req, res) => {
        res.json(arg1);
      });
    }

    if (_.isString(arg1)) {
      return fake.callsFake((req, res) => {
        res.end(arg1);
      });
    }
    return undefined;
  }

  get(url /*: string */) {
    return this.request("get", url);
  }

  post(url /*: string */) {
    return this.request("post", url);
  }

  put(url /*: string */) {
    return this.request("put", url);
  }

  delete(url /*: string */) {
    return this.request("delete", url);
  }

  /**
   * @param  {String} verb HTTP verb
   * @param  {String} url
   * @return {superagent}
   */
  request(verb /*: string */, url /*: string */) {
    return superagent[verb](url).on("request", reqData => {
      this.requests
        .get("outgoing")
        .push(
          _.pick(
            reqData,
            "method",
            "url",
            "header",
            "cookies",
            "qs",
            "protocol",
            "host"
          )
        )
        .write();
      const count = this.requests.get("outgoing").value().length;
      this.emit("outgoing.request", reqData);
      this.emit(`outgoing.request#${count}`, reqData);
      this.emit(`outgoing.request@${reqData.url}`, reqData);
      this.emit(`outgoing.request@${reqData.method}${reqData.url}`, reqData);
    });
  }

  /**
   * Stub Express application response for selected requests.
   * @param  {string|null} method
   * @param  {string|sinon.match} url
   * @param  {Object|sinon.match} query
   * @param  {string|Object|sinon.match} body
   * @return {sinon.stub}
   * @example
   * stubApp("/test").respond("test") // responds with "test" for all HTTP verbs on "/test"
   */
  stubApp(
    method /*: string|null */,
    url /*: string|null */,
    query /*: Object|sinon.match */,
    body /*: string|Object|sinon.match */
  ) {
    if (!url) {
      url = method;
      method = null;
    }

    method = method || sinon.match.any;
    if (_.isString(method)) {
      method = _.upperCase(method);
    }

    url = url || sinon.match.any;
    if (_.isString(url)) {
      url = sinon.match(url);
    }

    query = query || sinon.match.any;
    body = body || sinon.match.any;
    return this._stubMiddleware.withArgs(
      sinon.match.any,
      sinon.match.any,
      sinon.match.any,
      method,
      url,
      query,
      body
    );
  }

  _stubMiddleware = (
    req /*: Object */,
    res /*: Object */,
    next /*: Function*/,
    _method /*: string */,
    _url /*: string */,
    _query /*: Object */,
    _body /*: string|Object */
  ) => {
    console.log("STUBMIDDLEWARE");
    // eslint-disable-line class-methods-use-this,no-unused-vars
    next();
  };

  /**
   * Start the internal Express application
   * @param  {Number} port
   * @return {Promise}
   */
  listen(port /*: Number*/) /*: Promise */ {
    this.port = port;
    return Promise.fromCallback(callback => {
      this.server.listen(port, callback);
    });
  }

  /**
   * Close the server - important for automatic testing when you start and stop the server multiple times.
   * @return {Promise}
   */
  close() /*: Promise */ {
    return Promise.fromCallback(callback => {
      this.server.close(callback);
    });
  }

  /**
   * Allows to reset current mini-application state.
   * This reset behavior and history of the internal stub
   * as well as internal databases/states.
   *
   * @return {void}
   */
  reset() {
    this._stubMiddleware.reset();
    this._stubMiddleware.callThrough();
    this.db.setState({});
    this.requests.setState({ incoming: [], outgoing: [] });
  }

  /**
   * @param  {String} name filename
   * @return {undefined}
   */
  save(name /*: string */) {
    return fs.writeFileSync(
      `${name}.mini-app.json`,
      JSON.stringify(this.db.getState()),
      "utf-8"
    );
  }

  /**
   * @param  {String} name filename
   * @return {Object}
   */
  load(name /*: string */) {
    return this.db.setState(
      JSON.parse(fs.readFileSync(`${name}.mini-app.json`, "utf-8"))
    );
  }

  /**
   * For interactive usage - lists all json files in current directory
   * @return {Array}
   */
  list() {
    // eslint-disable-line class-methods-use-this
    return shell
      .ls("*.mini-app.json")
      .map(f => f.replace(".mini-app.json", ""));
  }
}

module.exports = MiniApplication;
