const _ = require("lodash");
const { post } = require("./request");
const { segmentsUrl, schemaUrl } = require("../config");

function getEntityParent(entityType) {
  if (entityType === "user_event") {
    return "user";
  }

  if (entityType === "user") {
    return "account";
  }

  return null;
}

function segments(entityType, { list } = {}) {

  const allSegmentsOption = {
    value: `all_segments`,
    label: `All ${_.startCase(entityType)} Segments`
  };

  return async (z, _bundle) => {
    if (entityType !== "user" && entityType !== "account") {
      return [];
    }
    const segment_choices = await post(z, {
      url: segmentsUrl,
      body: {
        entityType
      }
    });

    return [
      {
        key: `${entityType}_segments`,
        required: true,
        label: `${_.startCase(entityType)} Segment`,
        list,
        choices: _.concat(allSegmentsOption, segment_choices)
      }
    ];
  };
}

// TODO abstract better
async function getInputFields(
  z,
  bundle,
  inputFields,
  entityType,
  { list, fetch_attributes, attributes_required, inputType } = {}
) {
  inputFields = _.concat(
    inputFields,
    await segments(entityType, { list: true })(z, bundle)
  );

  if (entityType === "user" || entityType === "account") {
    if (fetch_attributes) {
      const choices = await post(z, {
        url: schemaUrl,
        body: {
          entityType
        }
      });
      inputFields = _.concat(inputFields, {
        key: `${entityType}_attributes`,
        required: attributes_required,
        label: `${_.startCase(entityType)} Attributes`,
        list,
        choices: choices
      });
    }
  }

  if (entityType === "user_event") {
    const choices = await post(z, {
      url: schemaUrl,
      body: {
        entityType
      }
    });
    inputFields = _.concat(inputFields, {
      key: entityType,
      required: true,
      label: inputType,
      list,
      choices: choices
    });
  }

  const parentEntityType = getEntityParent(entityType);
  if (!_.isNil(parentEntityType)) {
    return getInputFields(z, bundle, inputFields, parentEntityType, {
      list,
      fetch_attributes,
      attributes_required: false,
      inputType
    });
  }
  return inputFields;
}

function schema(entityType, { list, fetch_attributes, attributes_required, inputType  } = {}) {
  return async (z, _bundle) => {
    return getInputFields(z, _bundle, [], entityType, { list, fetch_attributes, attributes_required, inputType  });
  };
}

const getUserSegments = segments("user", { list: true });
const getAccountSegments = segments("account", { list: true });

const getUserAttributes = schema("user", {
  list: true,
  fetch_attributes: true,
  attributes_required: false,
  inputType: "User Attributes"
});

const getAccountAttributes = schema("account", {
  list: true,
  fetch_attributes: true,
  attributes_required: true,
  inputType: "Account Attributes"
});

const getUserEventSchema = schema("user_event", {
  list: true,
  fetch_attributes: false,
  inputType: "User Events"
});

function empty() {
  return async (z, _bundle) => {
    return [];
  };
}

const getEmpty = empty();

module.exports = {
  getEmpty,
  getUserSegments,
  getUserAttributes,
  getUserEventSchema,
  getAccountSegments,
  getAccountAttributes
};
