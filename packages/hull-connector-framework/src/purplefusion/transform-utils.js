/* @flow */
const _ = require("lodash");
const { isUndefinedOrNull, asyncForEach } = require("./utils");

function toUnixTimestamp() {
  return (date) => {
    const closeDate = new Date(date);
    return closeDate.getTime();
  }
}

async function performTransformation(dispatcher, context, initialInput, transformation) {

  let transforms = transformation;
  if (!Array.isArray(transforms)) {
    transforms = [transforms];
  }

  let input = initialInput;
  let target;

  // for (let i = 0; i < transforms.length; i += 1) {
  await asyncForEach(transforms, async (transform) => {

    target = await resolveIdentifier(dispatcher, context, initialInput, input, transform.target);

    const localContext = {};
    context.pushNew(localContext);
    try {
      if (transform.iterateOn) {
        const toIterateOn = await resolveIdentifier(dispatcher, context, initialInput, input, transform.iterateOn);

        // const keyValueArray = [];
        // _.forEach(toIterateOn, (value, key) => {
        //   keyValueArray.push({ value, key });
        // });
        //
        //for (let j = 0; j < keyValueArray.length; j += 1) {
        await asyncForEach(toIterateOn, async (value, key) => {
          _.assign(localContext, { value, key });
          localContext.operateValue = await resolveValue(dispatcher, context, initialInput, input, transform);
          if (transform.output.format) {
            localContext.operateValue = context.resolveVariables(transform.output.format);
          }

          if (!isUndefinedOrNull(localContext.operateValue)) {
            const path = context.resolveVariables(transform.output.path);
            _.set(target, path, localContext.operateValue);
          }
          // outputValue: { path, setIfValueIsNull, setIfTargetIsNull, format }
        });
      } else {
        localContext.operateValue = await resolveValue(dispatcher, context, initialInput, input, transform);
        if (transform.output.format) {
          localContext.operateValue = context.resolveVariables(transform.output.format);
        }

        if (!isUndefinedOrNull(localContext.operateValue)) {
          const path = context.resolveVariables(transform.output.path);
          _.set(target, path, localContext.operateValue);
        }
      }

      // input for next transformation is the target from this one
      input = target;

    } finally {
      context.popLatest();
    }
  });

  return target;
}

async function resolveValue(dispatcher, context, initialInput, input, transform) {
  const operatingOn = await resolveIdentifier(dispatcher, context, initialInput, input, transform.operateOn);

  if (transform.mapOn) {
    const keys = await resolveIdentifier(dispatcher, context, initialInput, input, transform.mapOn.key);
    const map = await resolveIdentifier(dispatcher, context, initialInput, input, transform.mapOn.map);

    let keyPath = keys;
    if (Array.isArray(keyPath)) {
      if (_.some(keyPath, isUndefinedOrNull)) {
        return undefined;
      }
      keyPath = _.join(keyPath, ".");
    }

    const mapValue = _.get(map, keyPath);

    if (typeof mapValue === "function") {
      if (operatingOn) {
        return mapValue(operatingOn);
      }
    } else {
      return mapValue;
    }

  }

  return operatingOn;

}

async function resolveIdentifier(dispatcher, context, initialInput, input, identifier) {
  if (Array.isArray(identifier)) {
    const results = [];
    for (let i = 0; i < identifier.length; i += 1) {
      const result = await resolve(dispatcher, context, initialInput, input, identifier[i]);
      results.push(result);
    }
    return results;
  }

  return await resolve(dispatcher, context, initialInput, input, identifier);

}

async function resolve(dispatcher, context, initialInput, input, identifier) {

  let resolvedObject;

  const type = identifier.type;
  const path = context.resolveVariables(identifier.path);
  const truthy = context.resolveVariables(identifier.truthy);

  if (type === "context") {
    return context.get(path);
  } else if (type === "settings") {
    return context.get(`connector.private_settings.${path}`);
  } else if (type === "initialInput") {
    // this is the original input value
    resolvedObject = initialInput;
  } else if (type === "input") {
    resolvedObject = input;
  }  else if (type === "glue") {
    resolvedObject = await dispatcher.dispatch(context, identifier.route, input);
  } else if (type === "static") {
    resolvedObject = identifier.object;
  } else if (type === "cloneInitialInput") {
    if (path) {
      return _.cloneDeep(_.get(initialInput, path));
    }
    return _.cloneDeep(initialInput);
  } else if (type === "new") {
    return {};
  }

  if (path) {
    resolvedObject = _.get(resolvedObject, path)
  }

  if (truthy) {
    resolvedObject = _.filter(resolvedObject, truthy);
  }
  return resolvedObject;

}


module.exports = {
  toUnixTimestamp,
  performTransformation
};
