/* @flow */
const _ = require("lodash");
const { isUndefinedOrNull, asyncForEach } = require("./utils");
const { Route } = require("./language");
const { SkippableError } = require("hull/src/errors");

function toUnixTimestamp() {
  return (date) => {
    const closeDate = new Date(date);
    return closeDate.getTime();
  }
}

function evaluateCondition(transform, context, input): boolean {
  if (!_.isPlainObject(transform) || !transform.condition) {
    return true;
  }
  const conditions = transform.condition;
  let conditionArray = [];
  if (!Array.isArray(conditions)) {
    conditionArray.push(conditions);
  } else {
    conditionArray = conditions;
  }
  for (let i = 0; i < conditionArray.length; i += 1) {
    const condition = conditionArray[i];
    if (typeof condition === 'string') {
      const value = context.get(condition);

      if (isUndefinedOrNull(value)) {
        return false
      } else if (typeof value === 'boolean' && !value) {
        return false;
      }
    } else if (typeof condition === 'function') {
      if (!condition(context, input)) {
        return false;
      }
    }
  }
  return true;
}

function evaluateValidation(transform, context, input) {
  if (transform.validation) {
    if (evaluateCondition(transform.validation.condition, context, input)) {
      if (transform.validation.error === "BreakProcess") {
        throw new Error(`Validation didn't pass for transform: ${transform.validation.message}\n ${JSON.stringify(transform, null, 2)}\n input: ${JSON.stringify(input, null, 2)}`);
      } else if (transform.validation.error === "Skip") {
        throw new SkippableError(`Validation didn't pass for transform: ${transform.validation.message} ${JSON.stringify(transform, null, 2)}`);
      }
    }
  }
}

function toTransform(transform, context, input) {
  evaluateValidation(transform, context, input);
  return evaluateCondition(transform, context, input);
}

async function performTransformation(dispatcher, context, initialInput, transformation) {

  const target = await resolveIdentifier(dispatcher, context, initialInput, initialInput, transformation.target);

  if (transformation.transforms) {
    await transformToTarget(dispatcher, context, initialInput, target, transformation.transforms);
  } else {
    await transformToTarget(dispatcher, context, initialInput, target, transformation);
  }

  return target;
}

async function transformToTarget(dispatcher, context, initialInput, target, transformation, inheritedOperateOn) {

  let transforms = transformation;
  if (!Array.isArray(transforms)) {
    transforms = [transforms];
  }

  // for (let i = 0; i < transforms.length; i += 1) {
  await asyncForEach(transforms, async (transform) => {

    if (!toTransform(transform, context, initialInput)) {
      return;
    }

    const localContext = {};
    context.pushNew(localContext);
    try {
      let operatingOn = inheritedOperateOn;
      if (transform.operateOn) {
        operatingOn = await resolveIdentifier(dispatcher, context, initialInput, target, transform.operateOn);
      }
      if (!isUndefinedOrNull(transform.expand) && transform.expand !== false) {
        const keyVariableName = _.get(transform, "expand.keyName", "expandKey");
        const valueVariableName = _.get(transform, "expand.valueName", "expandValue");
        await asyncForEach(operatingOn, async (value, key) => {
          _.assign(localContext, { [valueVariableName]: value, [keyVariableName]: key });
          await resolveValue(dispatcher, context, initialInput, target, transform, operatingOn);
        });
      } else {
        await resolveValue(dispatcher, context, initialInput, target, transform, operatingOn);
      }

    } finally {
      context.popLatest();
    }
  });
}

async function resolveValue(dispatcher, context, initialInput, target, transform, operatingOn) {

  if (transform.then) {
    await transformToTarget(dispatcher, context, initialInput, target, transform.then, operatingOn)
  }

  if (transform.writeTo) {

    let valueToOutput = operatingOn;
    context.set("value", valueToOutput);

    if (!toTransform(transform.writeTo, context, initialInput)) {
      return;
    }

    if (transform.writeTo.formatter) {
      const formatter = await resolveIdentifier(dispatcher, context, initialInput, target, transform.writeTo.formatter);
      if (typeof formatter === "function") {
        valueToOutput = formatter(valueToOutput);
        context.set("value", valueToOutput);
      }
    }

    if (transform.writeTo.format) {
      valueToOutput = context.resolveVariables(transform.writeTo.format);
      context.set("value", valueToOutput);
    }

    const keys = await resolveIdentifier(dispatcher, context, initialInput, target, transform.writeTo.path);

    let keyPath = keys;
    if (Array.isArray(keyPath)) {
      if (_.some(keyPath, isUndefinedOrNull)) {
        return undefined;
      }
      keyPath = _.join(keyPath, ".");
    }

    // if undefined, my be trying to unset things, so don't do an undefined check (no use cases yet, add unit test)
    // if null, then definitely could be setting something to null
    _.set(target, keyPath, valueToOutput);
  }

}

async function resolveIdentifier(dispatcher, context, initialInput, target, identifier) {
  if (Array.isArray(identifier)) {
    const results = [];
    for (let i = 0; i < identifier.length; i += 1) {
      const result = await resolve(dispatcher, context, initialInput, target, identifier[i]);
      results.push(result);
    }
    return results;
  }

  return await resolve(dispatcher, context, initialInput, target, identifier);

}

async function resolve(dispatcher, context, initialInput, target, identifier) {

  if (isUndefinedOrNull(identifier)) {
    return identifier;
  } else if (!identifier.component) {
    // TODO this is a pretty weak way to identify instructions, if there's a "component field, then this transform won't work...
    return context.resolveVariables(identifier);
  }

  const name = context.resolveVariables(identifier.name);

  let resolvedObject;

  const type = identifier.component;

  let selectors = [];
  let selectorsToResolve = identifier.select;
  if (selectorsToResolve) {
    if (!Array.isArray(selectorsToResolve)) {
      selectorsToResolve = [selectorsToResolve];
    }

    selectors = await resolveIdentifier(dispatcher, context, initialInput, target, selectorsToResolve);
  }

  if (type === "context") {
    if (!isUndefinedOrNull(selectors) && !_.isEmpty(selectors)) {
      if (typeof selectors[0] !== "string") {
        throw new Error(`Must have path as first selector into context. Cannot index into the context with: ${JSON.stringify(selectors)}`);
      }
      resolvedObject = context.get(selectors[0]);
      selectors = _.slice(selectors, 1);
    } else {
      throw new Error(`Must have a valid selector: ${JSON.stringify(selectors)}`)
    }
  } else if (type === "settings") {
    if (!isUndefinedOrNull(selectors) && !_.isEmpty(selectors)) {
      if (typeof selectors[0] !== "string") {
        throw new Error(`Must have path as first selector into settings. Cannot index into the settings with: ${JSON.stringify(selectors)}`);
      }
      resolvedObject = context.get(`connector.private_settings.${selectors[0]}`);
      selectors = _.slice(selectors, 1);
    } else {
      throw new Error(`Must have a valid selector: ${JSON.stringify(selectors)}`)
    }
  } else if (type === "initialInput") {
    // this is the original input value
    resolvedObject = initialInput;
  } else if (type === "input") {
    resolvedObject = target;
  }  else if (type === "glue") {
    resolvedObject = await dispatcher.resolve(context, new Route(identifier.route), initialInput);
  } else if (type === "static") {
    resolvedObject = identifier.object;
  } else if (type === "cloneInitialInput") {
    resolvedObject = _.cloneDeep(initialInput);
  } else if (type === "new") {
    return {};
  }

  if (_.some(selectors, isUndefinedOrNull)) {
    // Invalid selector, don't do anything
    return undefined;
  }

  _.forEach(selectors, selector => {
    // if it's a string, use to index in, otherwise use this as a truthy
    if (typeof selector === "string" || typeof selector === "number") {
      resolvedObject = _.get(resolvedObject, selector);
    } else {
      resolvedObject = _.filter(resolvedObject, selector);
    }
  });



  // if (truthy) {
  //   resolvedObject = _.filter(resolvedObject, truthy);
  // }
  //
  // if (path) {
  //   resolvedObject = _.get(resolvedObject, path)
  // }

  if (name) {
    context.set(name, resolvedObject);
  }

  return resolvedObject;

}


module.exports = {
  toUnixTimestamp,
  performTransformation,
  toTransform
};
