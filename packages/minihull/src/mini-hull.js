const _ = require("lodash");
const Promise = require("bluebird");
const lodashId = require("lodash-id");
const crypto = require("crypto");
const faker = require("faker");
const shell = require("shelljs");
const MiniApplication = require("./mini-application");

const minihullRouter = require("./router");

/**
 * A class build upon [MiniApplication](https://github.com/michaloo/mini-application) which allows to mimic [Hull Platform](https://hull.io) behavior.
 *
 * It comes with four different flavors of methods: "verb", `stub*`, `mimic*` and `fake*` methods:
 *
 * - "verb" methods - performs basic interactions between Hull and Connector,
 * they need to be supplied with all Connector information and don't rely on state other than external Connector.
 *
 * - `stub*` methods - stubs responses on specific endpoint of the MiniHull. Useful to stub state of the Platform end before
 * executing operations (see "verb" methods). Since they don't rely on internal state of MiniHull instance they
 * are most useful for integration tests.
 *
 * - `mimic*` methods - higher level methods to perform more complex operations, which base on internal
 * state (`db` param of the class) of the MiniHull instance. Most useful for interactive usage. See `fake*` methods
 * for complementary helpers.
 *
 * - `fake*` methods - to use `mimic*` methods we need internal state of MiniHull database (`db` param of the class).
 * To make the data seeding easier `fake*` methods provide an easy way of generating testing data.
 *
 * *Note:* Underscore methods `_*` are internal utilities and are not part of the public API of the library. Use with caution.
 *
 * @param {Object} options setup options
 * @param {string} options.secret secret used to sign requests to all installed connector instances (see `mimicInstall` method)
 */
class MiniHull extends MiniApplication {
  constructor(options = {}) {
    super();

    this.hostname = options.hostname || "localhost";
    this.overrideOrgAddr = options.overrideOrgAddr;
    this.secret = options.secret || "1234";

    // setup the internal db
    lodashId.createId = () => this.fakeId();
    this.db._.mixin(lodashId);
    this.db
      .defaults({
        connectors: [],
        users: [],
        users_segments: [],
        accounts_segments: [],
        accounts: []
      })
      .write();

    // setup the express application
    this.app.use("/api/v1/", minihullRouter(this));
    this.app.get("/_users_batch", (req, res) => {
      res.end(this._getUsersBatchBody());
    });

    this.app.get("/_accounts_batch", (req, res) => {
      res.end(this._getAccountsBatchBody());
    });
  }

  /*
   * --- Alias methods ---
   */

  users() {
    return this.db.get("users");
  }

  usersSegments() {
    return this.db.get("users_segments");
  }

  accountsSegments() {
    return this.db.get("accounts_segments");
  }

  connectors() {
    return this.db.get("connectors");
  }

  lastReq() {
    return this.requests.get("incoming").last();
  }

  /*
   * --- Verb methods ---
   */

  /**
   * Performs a basic POST request on connector instance.
   * Returns a [SuperAgent](https://github.com/visionmedia/superagent) instance,
   * remember to call `.then` to peform actual call.
   *
   * @public
   * @param  {Object} connector  Connector object
   * @param  {string} url Connector url (including path to the endpoint)
   * @return {superagent} SuperAgent instance
   */
  postConnector(connector, url, usersSegments = [], accountsSegments = []) {
    return this.post(url)
      .query({
        organization: this._getOrgAddr(),
        ship: connector.id,
        secret: this.secret
      })
      .send({
        connector,
        users_segments: usersSegments,
        accounts_segments: accountsSegments
      });
  }

  /**
   * Performs a special POST operation to the connector url
   *
   * @public
   * @param  {Object} connector  Connector object
   * @param  {string} url Connector url to batch endpoint
   * @return {superagent} SuperAgent instance
   */
  batchUsersConnector(
    connector,
    url,
    usersSegments = [],
    accountsSegments = []
  ) {
    return this.postConnector(connector, url, usersSegments, accountsSegments)
      .send({
        connector,
        url: `http://${this._getOrgAddr()}/_users_batch`,
        format: "json",
        object_type: "user_report"
      })
      .then(res => res);
  }

  /**
   * Performs a special POST operation to the connector url
   *
   * @public
   * @param  {Object} connector  Connector object
   * @param  {string} url Connector url to batch endpoint
   * @return {superagent} SuperAgent instance
   */
  batchAccountsConnector(
    connector,
    url,
    usersSegments = [],
    accountsSegments = []
  ) {
    return this.postConnector(connector, url, usersSegments, accountsSegments)
      .send({
        connector,
        url: `http://${this._getOrgAddr()}/_accounts_batch`,
        format: "json",
        object_type: "account_report"
      })
      .then(res => res);
  }

  /**
   * Performs a smart-notifier request to the connector
   *
   * @param  {Object} connector Connector object
   * @param  {string} url       Connector smart-notifier enabled endpoint
   * @param  {string} channel   Name of the notification channel
   * @param  {Array}  messages  Array of messages
   * @param  {Array}  usersSegments  Array of segments
   * @param  {Array}  accountsSegments  Array of segments
   * @param  {boolean}  is_export  boolean is payload batch
   * @return {superagent} SuperAgent instance
   */
  notifyConnector(
    connector,
    url,
    channel,
    messages,
    usersSegments = [],
    accountsSegments = [],
    is_export = false
  ) {
    if (typeof connector === "string") {
      throw new Error(
        "The `notifyConnector` method uses the following signature: `function(connector, url, channel, messages, usersSegments = [], accountsSegments = [])`. Are you using the legacy, deprecated signature?"
      );
    }

    const body = {
      notification_id: this.fakeId(),
      configuration: {
        id: connector.id,
        organization: this._getOrgAddr(),
        secret: this.secret
      },
      connector,
      users_segments: usersSegments,
      accounts_segments: accountsSegments,
      channel,
      messages,
      is_export
    };
    return this.post(url)
      .set("x-hull-smart-notifier", "dummy")
      .send(body)
      .then(res => res);
  }

  smartNotifyConnector() {
    throw new Error(
      "The `smartNotifyConnector` method has been replaced by `notifyConnector` - but it keeps the same signature. Beware of conflicts with the legacy `notifyConnector` method"
    );
  }

  /*
   * --- High level stubs ---
   */

  /**
   * Stubs MiniHull response on connector object
   *
   * @param  {Object} object Connector object
   * @return {this}   MiniHull instance
   */
  stubConnector(object) {
    this.stubApp(`/api/v1/${object.id}`).respond(object);
    this.stubApp("/api/v1/app").respond(object);
    return this;
  }

  stubConnectorNotFound(object) {
    const responseHandler = (req, res) => {
      res.status(404).json({ status: 404, message: "App not found" });
    };
    this.stubApp(`/api/v1/${object.id}`).respond(responseHandler);
    this.stubApp("/api/v1/app").respond(responseHandler);
    return this;
  }

  stubSegments() {
    throw new Error(
      "The `stubSegments` method doesn't exist anymore. Please use `stubUserSegments` instead"
    );
  }

  /**
   * Stubs MiniHull response to users segments endpoint
   *
   * @param  {Array} segments array of segments
   * @return {this}  MiniHull instance
   */
  stubUsersSegments(segments) {
    this.stubApp("get", "/api/v1/users_segments").respond(segments);
    return this;
  }

  /**
   * Stubs MiniHull response to accounts segments endpoint
   *
   * @param  {Array} segments array of segments
   * @return {this}  MiniHull instance
   */
  stubAccountsSegments(segments) {
    this.stubApp("get", "/api/v1/accounts_segments").respond(segments);
    return this;
  }

  /**
   * Stub batch endpoint
   *
   * @param  {Array} objects Array of user objects
   * @return {this}  MiniHull instance
   */
  stubUsersBatch(objects) {
    this.stubApp("get", "/_users_batch").respond(
      objects.map(o => JSON.stringify(o)).join("\n")
    );
    return this;
  }

  /**
   * Stub batch endpoint
   *
   * @param  {Array} objects Array of user objects
   * @return {this}  MiniHull instance
   */
  stubAccountsBatch(objects) {
    this.stubApp("get", "/_accounts_batch").respond(
      objects.map(o => JSON.stringify(o)).join("\n")
    );
    return this;
  }

  /*
   * --- Fake methods ---
   */

  /**
   * Generates fake ident used by MiniHull for connectors, users, segments
   *
   * @return {string} generated fake id
   */
  fakeId() {
    return crypto.randomBytes(12).toString("hex");
  }

  /**
   * Fakes basic user objects
   *
   * @param  {number} count Number of users to generate
   * @return {Array} Returns generated users
   */
  fakeUsers(count) {
    for (let i = 0; i < count; i += 1) {
      this.db
        .get("users")
        .insert({
          first_name: faker.name.firstName(),
          last_name: faker.name.lastName(),
          email: faker.internet.email(),
          updated_at: faker.date.recent()
        })
        .write();
    }
    return this.db.get("users").value();
  }

  /**
   * Fakes basic user objects
   *
   * @param  {number} count Number of users to generate
   * @return {Array} Returns generated users
   */
  fakeAccounts(count) {
    for (let i = 0; i < count; i += 1) {
      this.db
        .get("accounts")
        .insert({
          domain: faker.internet.domainName(),
          name: faker.company.companyName(),
          updated_at: faker.date.recent()
        })
        .write();
    }
    return this.db.get("accounts").value();
  }

  /**
   * Fake some users segments
   *
   * @param  {number} count Number of segments to generate
   * @return {Array} Returns generated segments
   */
  fakeUsersSegments(count) {
    const segments = [
      "Signed up",
      "Installed yesterday",
      "Prospects",
      "Leads",
      "Active",
      "Deals",
      "Demo requests",
      "Qualified Leads"
    ];
    for (let i = 0; i < count; i += 1) {
      this.db
        .get("users_segments")
        .insert({
          name: segments[Math.floor(Math.random() * segments.length)],
          created_at: faker.date.recent(),
          updated_at: faker.date.recent()
        })
        .write();
    }
    return this.db.get("users_segments").value();
  }

  /**
   * Fake some accounts segments
   *
   * @param  {number} count Number of segments to generate
   * @return {Array} Returns generated segments
   */
  fakeAccountsSegments(count) {
    const segments = [
      "Big companies",
      "Small companies",
      "Medium companies",
      "SaaS companies",
      "Customers"
    ];
    for (let i = 0; i < count; i += 1) {
      this.db
        .get("accounts_segments")
        .insert({
          name: segments[Math.floor(Math.random() * segments.length)],
          created_at: faker.date.recent(),
          updated_at: faker.date.recent()
        })
        .write();
    }
    return this.db.get("accounts_segments").value();
  }

  /**
   * Radomly assing existing users to existing segments
   *
   * @return {Array} users array
   */
  fakeUsersSegmentsAssignment() {
    return this.db
      .get("users")
      .map(user => {
        const count = faker.random.number({
          max: this.db.get("users_segments").size()
        });
        for (let i = 0; i < count; i += 1) {
          user._segment_ids = _.uniq(
            (user._segment_ids || []).concat(
              faker.random.arrayElement(this.db.get("users_segments").value())
                .id
            )
          );
        }
        return user;
      })
      .write();
  }

  /**
   * Radomly assing existing users to existing segments
   *
   * @return {Array} users array
   */
  fakeAccountSegmentsAssignment() {
    return this.db
      .get("accounts")
      .map(account => {
        const count = faker.random.number({
          max: this.db.get("accounts_segments").size()
        });
        for (let i = 0; i < count; i += 1) {
          account._segment_ids = _.uniq(
            (account._segment_ids || []).concat(
              faker.random.arrayElement(
                this.db.get("accounts_segments").value()
              ).id
            )
          );
        }
        return account;
      })
      .write();
  }

  /**
   * Radomly assing existing users to existing segments
   *
   * @return {Array} users array
   */
  fakeUserAccountAssignment() {
    return this.db
      .get("users")
      .map(user => {
        user._account_id = faker.random.arrayElement(
          this.db.get("accounts").value()
        ).id;
        return user;
      })
      .write();
  }

  fakeAll(
    usersCount = 10,
    accountsCount = 3,
    usersSegmentsCount = 5,
    accountsSegmentsCount = 2
  ) {
    this.fakeUsers(usersCount);
    this.fakeAccounts(accountsCount);
    this.fakeUserAccountAssignment();
    this.fakeUsersSegments(usersSegmentsCount);
    this.fakeUsersSegmentsAssignment();
    this.fakeAccountsSegments(accountsSegmentsCount);
    this.fakeAccountSegmentsAssignment();
    return this.db.get("users").value();
  }

  // --- Mimic methods ---

  /**
   * Mimic the connector installation process
   *
   * @param  {string} connectorUrl Connector url to install from
   * @return {Promise}             Request promise
   */
  mimicInstall(connectorUrl) {
    return this.get(`${connectorUrl}/manifest.json`)
      .then(res => {
        return this.db
          .get("connectors")
          .insert({
            _url: connectorUrl,
            manifest: res.body,
            private_settings: {}
          })
          .write();
      })
      .then(connector => {
        return this.mimicSendNotification("ship:update", [connector]);
      });
  }

  /**
   * Opens a url to connector dashboard
   *
   * @param  {string} connectorId Optional connector id
   * @return {Object}             ShellJs response
   */
  mimicDashboard(connectorId) {
    const connector = connectorId
      ? this.db.get("connectors").find({ id: connectorId }).value()
      : this.db.get("connectors").get(0).value();

    if (!connector.manifest.admin) {
      return console.log("No dashboard available");
    }
    const url = this._getConnectorUrl(connector, connector.manifest.admin);
    return shell.exec(`open "${url}"`);
  }

  /**
   * Performs post call to the selected connector. If no connectorId is passed performs the call to the first installed.
   *
   * @param  {string} url         Connector endpoint url
   * @param  {string} connectorId Optional connector id
   * @return {Request}            Request promise
   */
  mimicPostConnector(url, connectorId) {
    const connector = connectorId
      ? this.db.get("connectors").find({ id: connectorId }).value()
      : this.db.get("connectors").get(0).value();

    return this.postConnector(connector, connector._url);
  }

  /**
   * Sends a notification to all installed connectors using the information from manifest.
   *
   * @param  {string} channel   Notification topic
   * @param  {Array} messages Notification message
   * @return {Promise}        Request promise
   */
  mimicSendNotification(channel, messages) {
    return Promise.all(
      this.db.get("connectors").reduce((acc, connector) => {
        _.map(connector.manifest.subscriptions, subscription => {
          acc.push(
            this.notifyConnector(
              connector,
              `${connector._url}${subscription.url}`,
              channel,
              messages,
              this.db.get("users_segments"),
              this.db.get("accounts_segments")
            )
          );
        });
        return acc;
      }, [])
    );
  }

  /**
   * Creates a UserReport object for selected user
   *
   * @param  {Object} ident Object to indentify user we want to sent (passed to lodash `find` function)
   * @return {Object}       Built `UserReport`
   */
  mimicUserReport(ident) {
    const user = this.db.get("users").find(ident).value();
    const userSegments = this._getMatchingUsersSegments(user).value();
    const account = this.db
      .get("accounts")
      .find({ id: user._account_id })
      .value();
    const accountSegments = account._segment_ids
      ? this._getMatchingAccountsSegments(account).value()
      : [];
    return {
      user,
      user_segments: userSegments,
      account,
      account_segments: accountSegments,
      changes: {},
      events: []
    };
  }

  /**
   * Mimics a user enter segment event which will be sent using `mimicSendNotification` method.
   * Alters internal db.
   *
   * @param  {Object} ident     Object to indentify user we want to sent (passed to lodash `find` function)
   * @param  {string} segmentId Id of the segment user should "enter"
   * @return {Promise}          Request promise
   */
  mimicUserEntersSegment(ident, segmentId) {
    const user = this._findUser(ident);
    user._segment_ids = _.uniq((user._segment_ids || []).concat(segmentId));
    const segments = this._getMatchingUsersSegments(user).value();
    const changes = {
      segments: {
        enter: this.segments().filter({ id: segmentId }).value()
      }
    };
    return this.mimicSendNotification("user:update", [
      { user, segments, changes, events: [] }
    ]);
  }

  /**
   * Mimics a user left segment event which will be sent using `mimicSendNotification` method.
   * Alters internal db.
   *
   * @param  {Object} ident     Object to indentify user we want to sent (passed to lodash `find` function)
   * @param  {string} segmentId Id of the segment user should leave
   * @return {Promise}          Request promise
   */
  mimicUserExitsSegment(ident, segmentId) {
    const user = this._findUser(ident);
    _.remove(user._segment_ids, sId => sId === segmentId);
    const segments = this._getMatchingUsersSegments(user).value();
    const changes = {
      segments: {
        left: this.segments().filter({ id: segmentId }).value()
      }
    };
    return this.mimicSendNotification("user:update", [
      { user, segments, changes, events: [] }
    ]);
  }

  /**
   * Mimics an user:update event which will be sent using `mimicSendNotification` method.
   * Alters internal db.
   *
   * @param  {Object} ident  Object to indentify user we want to sent (passed to lodash `find` function)
   * @param  {Object} traits Target traits values
   * @return {Promise}       Request promise
   */
  mimicUpdateUser(ident, traits) {
    const user = this._findUser(ident);
    const changes = this._diff(user, traits);
    _.merge(user, traits);
    const segments = this._getMatchingUsersSegments(user).value();
    return this.mimicSendNotification("user:update", [
      { user, segments, changes, events: [] }
    ]);
  }

  /**
   * Mimics connector private settings update event
   *
   * @param  {Object} settings    New connector private settings
   * @param  {string} connectorId Optional connector id
   * @return {Promise}            Request promise
   */
  mimicUpdateConnector(settings, connectorId) {
    const connector = connectorId
      ? this.db.get("connectors").find({ id: connectorId }).value()
      : this.db.get("connectors").get(0).value();
    connector.private_settings = _.merge(
      connector.private_settings || {},
      settings
    );
    return this.mimicSendNotification("ship:update", [connector]);
  }

  /**
   * Mimics an event when segment was altered.
   *
   * @param  {string} segmentName Segment name to sent
   * @param  {string} segmentId   Optional segment id
   * @return {Promise}            Request promise
   */
  mimicUpdateUserSegment(segmentName, segmentId) {
    const segment = segmentId
      ? this.db.get("users_segments").find({ id: segmentId }).value()
      : this.db.get("users_segments").get(0).value();
    segment.name = segmentName;
    return this.mimicSendNotification("segment:update", [segment]);
  }

  /**
   * Mimics a batch call to the connector
   *
   * @param  {string} connectorId Optional connector id
   * @return {Promise}            Request promise
   */
  mimicUsersBatchCall(connectorId) {
    const connector = connectorId
      ? this.db.get("connectors").find({ id: connectorId }).value()
      : this.db.get("connectors").get(0).value();
    return this.batchUsersConnector(
      connector,
      `${connector._url}/batch`,
      "user",
      this.db.get("users_segments"),
      this.db.get("accounts_segments")
    );
  }

  /*
   * --- Utilities methods ---
   */

  _getOrgAddr() {
    if (this.overrideOrgAddr) {
      return this.overrideOrgAddr;
    }
    return `${this.hostname}:${this.server.address().port}`;
  }

  _getConnectorUrl(connector, url) {
    return `${connector._url}${url}?ship=${
      connector.id
    }&organization=${this._getOrgAddr()}&secret=${this.secret}`;
  }

  _diff(objectA, objectB) {
    const diff = {};
    _.reduce(
      objectB,
      (acc, value, key) => {
        if (objectA[key] !== value) {
          acc[key] = [objectA[key] || null, value];
        }
        return acc;
      },
      diff
    );

    return diff;
  }

  _getMatchingUsersSegments(user) {
    if (!user._segment_ids) {
      user = this._findUser(user);
    }
    const matchingSegments = this.db.get("users_segments").intersectionBy(
      (user._segment_ids || []).map(id => ({ id })),
      "id"
    );
    return matchingSegments;
  }

  _getMatchingAccountsSegments(account) {
    if (!account._segment_ids) {
      account = this._findAccount(account);
    }
    console.log("_getMatchingAccountsSegments", account);
    const matchingSegments = this.db.get("accounts_segments").intersectionBy(
      (account._segment_ids || []).map(id => ({ id })),
      "id"
    );
    return matchingSegments;
  }

  _getUsersBatchBody() {
    const users = this.db.get("users").cloneDeep();
    return users
      .value()
      .map(u => {
        u.segments_id = u._segment_ids;
        delete u._segment_ids;
        return JSON.stringify(u);
      })
      .join("\n");
  }

  _getAccountsBatchBody() {
    const accounts = this.db.get("accounts").cloneDeep();
    return accounts
      .value()
      .map(a => {
        a.segments_id = a._segment_ids;
        delete a._segment_ids;
        return JSON.stringify(a);
      })
      .join("\n");
  }

  _findUser(ident) {
    let findObject = ident;
    if (_.isString(ident)) {
      findObject = { id: ident };
    }
    return this.db.get("users").find(findObject).value();
  }
}

module.exports = MiniHull;
