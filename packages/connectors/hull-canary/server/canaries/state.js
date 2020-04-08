const _ = require("lodash");

const { hullReservedPrefix, hullReservedCounter } = require("./reserved");

// eslint-disable-next-line global-require
const canaries = [
  require("./definitions/change-email-when-external-id-exists"),
  require("./definitions/link-account"),
  require("./definitions/hidden-account-traits"),
  require("./definitions/sessions-on-user-merge"),
  require("./definitions/merge-users-then-track"),
  require("./definitions/segment-entered-left-event"),
  require("./definitions/segment-entered-left-attribute"),
];

let currentCanaryIndex = -1;
let currentCanaryStage = 0;
let state = {};

function getState() {
  return state;
}

function hasStarted() {
  return currentCanaryIndex >= 0;
}
function hasCompleted() {
  return currentCanaryIndex >= canaries.length;
}

function getActiveCanary() {
  return canaries[currentCanaryIndex];
}

function hasNextCanary() {
  return currentCanaryIndex < canaries.length - 1;
}

function getActiveStage() {
  return getActiveCanary().stages[currentCanaryStage];
}

function hasNextStage() {
  return currentCanaryStage < getActiveCanary().stages.length - 1;
}

function resetState() {
  state = {
    userUpdates: [],
    usersCreated: [],
    userEvents: [],
    usersMerged: [],
    userAccountLinks: [],
    userAccountMerged: [],
    userAccountChanged: [],
    accountUpdates: [],
    accountsCreated: [],
    accountsMerged: [],
    accountUpdateDefinitions: [],
    userUpdateDefinitions: []
  };

  // if we're still in the middle of testing, reset the stage...
  if (hasStarted() && !hasCompleted()) {
    const activeStage = getActiveStage();
    // these definitions are special
    // we evaluate them individually, and we use a clone
    // of them as a data structure to determine if the definitions have been statisfied
    if (activeStage.accountUpdateDefinitions) {
      state.accountUpdateDefinitions = _.cloneDeep(
        activeStage.accountUpdateDefinitions
      );
    }
    if (activeStage.userUpdateDefinitions) {
      state.userUpdateDefinitions = _.cloneDeep(
        activeStage.userUpdateDefinitions
      );
    }
  }
}

function resetAll() {
  currentCanaryIndex = -1;
  currentCanaryStage = 0;
  resetState();
}

function nextCanary() {
  currentCanaryIndex += 1;
  currentCanaryStage = 0;
  resetState();
}

function nextStage() {
  currentCanaryStage += 1;
  resetState();
}

function getStageStatus() {
  const activeCanary = getActiveCanary();
  const activeCanaryStage = activeCanary.stages[currentCanaryStage];

  let failed = false;
  let completed = true;

  // console.log("Accountdef empty: " + _.isEmpty(state.accountUpdateDefinitions));
  if (!_.isEmpty(state.accountUpdateDefinitions)) {
    // console.log("ACCOUNT: " + JSON.stringify(state  .accountUpdateDefinitions));
    completed = false;
  }

  // console.log("Userdef empty: " + _.isEmpty(state.userUpdateDefinitions));
  if (!_.isEmpty(state.userUpdateDefinitions)) {
    // console.log("USER: " + JSON.stringify(state.userUpdateDefinitions));
    completed = false;
  }

  _.forIn(state, (value, key) => {
    const verificationCount = activeCanaryStage[key];

    if (verificationCount && typeof verificationCount === "number") {
      console.log(
        `${activeCanary.name}[${currentCanaryStage}] ${key} ${
          value.length
        } out of ${verificationCount}`
      );
      if (value.length > verificationCount) {
        // then the number of events received is greater than number of events expected
        // fails the test
        failed = true;
      }

      if (value.length < verificationCount) {
        completed = false;
      }
    }
  });

  return { failed, completed };
}

function isNewValue(changeValues) {
  if (!_.isEmpty(changeValues)) {
    if (
      changeValues.length === 2 &&
      changeValues[0] === null &&
      !_.isEmpty(changeValues[1])
    ) {
      return true;
    }
  }
  return false;
}

function updatedExistingValue(changeValues) {
  if (!_.isEmpty(changeValues)) {
    if (
      changeValues.length === 2 &&
      !_.isEmpty(changeValues[0]) &&
      !_.isEmpty(changeValues[1])
    ) {
      return true;
    }
  }
  return false;
}

function markDefinitionComplete(definition, definitions) {
  const definitionIndex = _.indexOf(definitions, definition);
  // console.log("Found index: " + definitionIndex);
  if (definitionIndex >= 0) {
    const matchedDefinition = _.nth(definitions, definitionIndex);
    // console.log("matchedDefinition: " + JSON.stringify(matchedDefinition));
    const number = matchedDefinition[hullReservedCounter];
    if (typeof number === "number" && number !== 1) {
      // console.log("Decrementing: " + number);
      matchedDefinition[hullReservedCounter] = number - 1;
    } else {
      // console.log("BEFORE: " + JSON.stringify(definitions));
      // console.log("Pulling: " + definitionIndex);
      _.pullAt(definitions, [definitionIndex]);
      // console.log("AFTER: " + JSON.stringify(definitions));
    }
  }
}

async function identifyDefinitions(message, definitions, context) {
  const identifiedDefinitions = [];
  for (let i = 0; i < definitions.length; i += 1) {
    const definition = definitions[i];
    // console.log("Definition: " + Object.keys(definition));
    // loop through and try to identify if all the conditions for
    // this definition have been met, if so return true
    let identified = true;
    const keys = Object.keys(definition);

    for (let j = 0; j < keys.length; j += 1) {
      const propertyName = keys[j];
      const conditional = definition[propertyName];

      if (_.startsWith(propertyName, hullReservedPrefix)) return;

      let passes = true;
      if (typeof conditional === "function") {
        // console.log("function: " + propertyName + _.get(message, propertyName));
        passes = await conditional(_.get(message, propertyName), context, message);
      } else {
        // console.log("strict equality" + propertyName);
        passes = _.get(message, propertyName) === conditional;
      }
      // console.log("passes: " + passes);
      // if any one datapoint doesn't pass, then identified = false
      // all must pass
      if (!passes) identified = false;
    }

    // console.log("Identified: " + identified);

    if (identified) {
      identifiedDefinitions.push(definition);
    }
  }
  return Promise.resolve(identifiedDefinitions);
}

/**
 * this is definition data mutation, but I don't think it falls into the
 * same context as the general argument as the data maniuplation anti-pattern
 * which I think more applies to inputs and outputs in pipeline
 * I'm using this more like a transient data structure like a stack or queue
 */
function removeFirstMatchingDefinition(message, definitions) {
  const identified = identifyDefinitions(message, definitions);
  if (identified.length > 0) {
    markDefinitionComplete(identified[0], definitions);
  }
}

async function removeMatchingDefinitions(message, definitions, context) {
  const identified = await identifyDefinitions(message, definitions, context);
  _.forEach(identified, definition => {
    markDefinitionComplete(definition, definitions);
  });
}

async function receiveUserUpdate(messages, context) {
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    const userIdent = _.pick(message, [
      "user.id",
      "user.email",
      "account.id",
      "account.external_id",
      "account.domain"
    ]);

    // any user update goes in here
    state.userUpdates.push(userIdent);
    message.events.forEach(event => {
      state.userEvents.push(event);
    });

    const isNew = _.get(message, "changes.is_new");
    if (isNew) {
      // only users that were created go here
      state.usersCreated.push(userIdent);
    }

    // light account merge detection, not the greatest
    // but no other clear signature
    if (updatedExistingValue("changes.user.id")) {
      state.usersMerged.push(userIdent);
    }

    const accountIdChange = _.get(message, "changes.account.id");
    if (!_.isEmpty(accountIdChange)) {
      // if the users account get linked to an account then signal here
      state.userAccountLinks.push(userIdent);

      if (accountIdChange[0] != null) {
        // this is only if user was originally linked to a different account
        // then got linked to a new account (could indicate a merge)
        state.userAccountChanged.push(userIdent);
      }
    }

    if (!_.isEmpty(state.userUpdateDefinitions)) {
      await removeMatchingDefinitions(
        message,
        state.userUpdateDefinitions,
        context
      );
    }
  }
}

async function receiveAccountUpdate(messages, context) {
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    const accountIdent = _.pick(message.account, [
      "id",
      "external_id",
      "domain"
    ]);
    state.accountUpdates.push(accountIdent);

    const isNew = _.get(message, "changes.is_new");
    if (isNew) {
      state.accountsCreated.push(accountIdent);
    }

    const newDomainChange = isNewValue(
      _.get(message, "changes.account.domain")
    );
    const newExternalIdChange = isNewValue(
      _.get(message, "changes.account.external_id")
    );

    // light account merge detection, not the greatest
    // but no other clear signature
    if (!isNew && (newDomainChange || newExternalIdChange)) {
      state.accountsMerged.push(accountIdent);
    }

    if (!_.isEmpty(state.accountUpdateDefinitions)) {
      await removeMatchingDefinitions(
        message,
        state.accountUpdateDefinitions,
        context
      );
    }
  }
}

module.exports = {
  resetAll,
  getState,
  hasStarted,
  hasCompleted,
  getActiveCanary,
  hasNextCanary,
  nextCanary,
  getActiveStage,
  hasNextStage,
  nextStage,
  getStageStatus,
  receiveUserUpdate,
  receiveAccountUpdate
};
