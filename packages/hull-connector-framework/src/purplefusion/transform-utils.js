/* @flow */
const _ = require("lodash");
const { isUndefinedOrNull, asyncForEach } = require("./utils");
const { Route } = require("./language");

function toUnixTimestamp() {
  return (date) => {
    const closeDate = new Date(date);
    return closeDate.getTime();
  }
}

function evaluateCondition(conditions, context, input): boolean {
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
    //evaluate transforma.validation.condition
    //if true
    // look at transform.validation.error
    //if error === "breakeverything"
  }
}

function toTransform(transform, context, input) {
  if (!_.isPlainObject(transform) || !transform.condition) {
    evaluateValidation(transform, context, input);
    return true;
  }

  if (evaluateCondition(transform.condition, context, input)) {
    evaluateValidation(transform, context, input);
    return true;
  }
  return false;
}

async function performTransformation(dispatcher, context, input, transformation) {

  // top level target is returned...
  // unless asPipeline is defined, then the output of the last transform is returned...
  // can "undefine" asPipeline by setting target: {component: "input" to be passed to next in pipeline}

  return await transformToTarget({ dispatcher, context, input, transformation });
}

async function transformToTarget({ dispatcher, context, input, transformation, target, operatingOn }) {

  let currentTarget = target;

  const localContext = {};
  context.pushNew(localContext);
  // TODO have to be careful with scoping of setting "operateOn" variable...
  // I like this push of a new context when we resolve it, need ot make sure it's only inherited from parent
  // and doesn't get set in between parallel transforms
  try {

    // target probably should be resolved first.... even before toTransform
    // better to have consistent objects being passed between transforms probably rather than worry about conditionals
    if (transform.target) {
      currentTarget = await resolveIdentifier(dispatcher, context, input, currentTarget, transformation.target);
    }

    if (!toTransform(transform, context, input)) {
      return currentTarget;
    }

    let operateOn = operatingOn;
    if (transform.operateOn) {
      operateOn = await resolveIdentifier(dispatcher, context, input, currentTarget, transform.operateOn);
      context.set("operateOn", operateOn);
    }

    if (transform.writeTo) {
      await writeTo(dispatcher, context, input, target, transform, operatingOn);
    }

    if (!isUndefinedOrNull(transformation.expand) && transformation.expand !== false) {
      const keyVariableName = _.get(transformation, "expand.keyName", "expandKey");
      const valueVariableName = _.get(transformation, "expand.valueName", "expandValue");

      // should be because this is executed serially, we don't need to create a new localContext everytime
      await asyncForEach(operateOn, async (value, key) => {
        _.assign(localContext, { [valueVariableName]: value, [keyVariableName]: key });

        // passing the expanded operate on as the thing we're operating on
        // can't set currentTarget with expansion
        let expandTarget = currentTarget;
        if (_.get(transformation, "expand.setAsTarget" === true)) {
          expandTarget = value;
        }

        await resolveTransform(dispatcher, context, input, expandTarget, transformation, value);
      });
    } else {
      currentTarget = await resolveTransform(dispatcher, context, input, currentTarget, transformation, operateOn);
    }

  } finally {
    context.popLatest();
  }

  return currentTarget;
}

async function resolveTransform(dispatcher, context, input, target, transformation, operatingOn) {

  let result = target;

  if (transform.then) {

    let nestedTransforms = transform.then;
    if (!Array.isArray(nestedTransforms)) {
      nestedTransforms = [nestedTransforms];
    }

    await asyncForEach(nestedTransforms, async (nestedTransform) => {
      const transformResult = await transformToTarget({ dispatcher, context, input, result, transform: nestedTransform, operatingOn} );
      if (_.get(transform, "target.asPipeline") === true) {
        result = transformResult;
      }
    });

  }

  return result;

}

async function writeTo(dispatcher, context, input, target, transform, operatingOn) {

  let valueToOutput = operatingOn;

  if (!toTransform(transform.writeTo, context, input)) {
    return;
  }

  if (transform.writeTo.formatter) {
    const formatter = await resolveIdentifier(dispatcher, context, input, target, transform.writeTo.formatter);
    if (typeof formatter === "function") {
      valueToOutput = formatter(valueToOutput);
      context.set("formattedValue", valueToOutput);
    }
  }

  const keys = await resolveIdentifier(dispatcher, context, input, target, transform.writeTo.path);

  let keyPath = keys;
  if (Array.isArray(keyPath)) {
    if (_.some(keyPath, isUndefinedOrNull)) {
      return undefined;
    }
    keyPath = _.join(keyPath, ".");
  }

  if (transform.writeTo.pathFormatter) {
    const formatter = await resolveIdentifier(dispatcher, context, input, target, transform.writeTo.pathFormatter);
    if (typeof formatter === "function") {
      keyPath = formatter(keyPath, context);
      context.set("formattedPath", keyPath);
    }
  }

  if (transform.writeTo.format) {
    valueToOutput = context.resolveVariables(transform.writeTo.format);
  }

  // if undefined, my be trying to unset things, so don't do an undefined check (no use cases yet, add unit test)
  // if null, then definitely could be setting something to null
  _.set(target, keyPath, valueToOutput);

}

async function resolveIdentifier(dispatcher, context, input, target, identifier) {
  if (Array.isArray(identifier)) {
    const results = [];
    await asyncForEach(identifier, async (individualIdentifier) => {
      const result = await resolve(dispatcher, context, input, target, individualIdentifier);
      results.push(result);
    });
    return results;
  }

  return await resolve(dispatcher, context, input, target, identifier);

}

async function resolve(dispatcher, context, input, target, identifier) {

  if (isUndefinedOrNull(identifier)) {
    return identifier;
  } else if (!identifier.component) {
    // this is a pretty weak way to identify instructions, if there's a "component" field, then this transform won't work...
    // in those cases could use "static" component type which passes through a static object
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

    selectors = await resolveIdentifier(dispatcher, context, input, target, selectorsToResolve);
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
    resolvedObject = input;
  } else if (type === "input") {
    resolvedObject = target;
  }  else if (type === "glue") {
    resolvedObject = await dispatcher.resolve(context, new Route(identifier.route), input);
  } else if (type === "static") {
    resolvedObject = identifier.object;
  } else if (type === "cloneInitialInput") {
    resolvedObject = _.cloneDeep(input);
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

  if (name) {
    context.set(name, resolvedObject);
  }

  if (resolvedObject === undefined && identifier.onUndefined !== undefined) {
    return await resolveIdentifier(dispatcher, context, input, target, identifier.onUndefined);
  }

  return resolvedObject;

}


module.exports = {
  toUnixTimestamp,
  performTransformation,
  toTransform
};
