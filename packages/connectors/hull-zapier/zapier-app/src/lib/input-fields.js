const _ = require("lodash");
const jsonata = require("jsonata");
const { getEntityAttributes, getEntitySegments } = require("./hull-service");

const attributeTransformation = jsonata(`[$.{"label": $substringAfter(name, "."), "value": $substringAfter(name, ".")}]`);

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
    const segment_choices = await getEntitySegments(z, entityType);

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
      const choices = await getEntityAttributes(z, entityType);
      inputFields = _.concat(inputFields, {
        key: `${entityType}_attributes`,
        required: attributes_required,
        label: `${_.startCase(entityType)} Attributes`,
        list,
        choices: attributeTransformation.evaluate(choices)
      });
    }
  }

  if (entityType === "user_event") {
    const choices = await getEntityAttributes(z, entityType);
    inputFields = _.concat(inputFields, {
      key: entityType,
      required: true,
      label: inputType,
      list,
      choices: attributeTransformation.evaluate(choices)
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

const getUserSegmentInputFields = segments("user", { list: true });
const getAccountSegmentInputFields = segments("account", { list: true });

const getUserAttributeInputFields = schema("user", {
  list: true,
  fetch_attributes: true,
  attributes_required: false,
  inputType: "User Attributes"
});

const getAccountAttributeInputFields = schema("account", {
  list: true,
  fetch_attributes: true,
  attributes_required: true,
  inputType: "Account Attributes"
});

const getUserEventInputFields = schema("user_event", {
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
  getUserSegmentInputFields,
  getUserAttributeInputFields,
  getUserEventInputFields,
  getAccountSegmentInputFields,
  getAccountAttributeInputFields
};
