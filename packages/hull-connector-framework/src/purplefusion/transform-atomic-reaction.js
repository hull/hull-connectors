const _ = require("lodash");

const { isUndefinedOrNull, asyncForEach } = require("./utils");
const { Route } = require("./language");

const debug = require("debug")("hull-shared:AtomicReaction");

const { toTransform } = require("../../src/purplefusion/transform-utils");

async function performTransformation(dispatcher, context, input, transformation) {

  // top level target is returned...
  // unless asPipeline is defined, then the output of the last transform is returned...
  // can "undefine" asPipeline by setting target: {component: "input" to be passed to next in pipeline}
  return await transformToTarget({ dispatcher, context, input, transformation });

}

async function transformToTarget({ dispatcher, context, input, transformation, target, operatingOn }) {

  // return the target unless otherwise directed
  let currentTarget = target;

  const localContext = {};
  context.pushNew(localContext);
  // TODO have to be careful with scoping of setting "operateOn" variable...
  // I like this push of a new context when we resolve it, need ot make sure it's only inherited from parent
  // and doesn't get set in between parallel transforms
  try {

    // set input so that we can easily reference attributes through variables
    context.set("input", input);

    // target probably should be resolved first.... even before toTransform
    // better to have consistent objects being passed between transforms probably rather than worry about conditionals
    if (transformation.target) {
      currentTarget = await resolveIdentifier(dispatcher, context, input, currentTarget, transformation.target);
      context.set("target", currentTarget);
    }

    let operateOn = operatingOn;
    if (transformation.operateOn) {

      // for operate on, if it's just a string, look it up on the input by default
      // may want to do this for everything? but for now just "operateOn"
      // TODO but WTF if you're trying to operate on a variable?  It will be resolved, then use as a get on the input...
      // can't do this, especially if you want to operate on a string....
      //if we set "input" variable, could do: "${input.someattribute}"

      // if (typeof transformation.operateOn === "string") {
      //   operateOn = _.get(input, context.resolveVariables(transformation.operateOn));
      // } else {
      //   operateOn = await resolveIdentifier(dispatcher, context, input, currentTarget, transformation.operateOn);
      // }

      operateOn = await resolveIdentifier(dispatcher, context, input, currentTarget, transformation.operateOn);
      context.set("operateOn", operateOn);
      debug(`Operating On (${JSON.stringify(operateOn)})`);
    }

    if (!toTransform(transformation, context, input)) {
      return currentTarget;
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
        context.set("operateOn", value);
        // can't really return anything relevant on an expand, so don't set toReturn
        // always return the target
        await resolveTransform(dispatcher, context, input, expandTarget, transformation, value);
      });
    } else {
      currentTarget = await resolveTransform(dispatcher, context, input, currentTarget, transformation, operateOn);
    }

    // Performing depthfirst traversal by doing writeTo last is a little safer from a variable point of view
    // because performWrite writes a bunch of variables to the context that we probably don't want visible to the nested transforms
    if (transformation.writeTo) {
      await performWrite(dispatcher, context, input, currentTarget, transformation.writeTo, operateOn);
    }

  } finally {
    context.popLatest();
  }

  return currentTarget;
}

async function resolveTransform(dispatcher, context, input, target, transformation, operatingOn) {

  let nextInput = input;

  const asPipeline = transformation.asPipeline === true;

  if (transformation.then) {

    let nestedTransforms = transformation.then;
    if (!Array.isArray(nestedTransforms)) {
      nestedTransforms = [nestedTransforms];
    }

    await asyncForEach(nestedTransforms, async (nestedTransform) => {
      const transformResult = await transformToTarget({ dispatcher, context, input: nextInput, target, transformation: nestedTransform, operatingOn} );
      if (asPipeline) {
        nextInput = transformResult;
      }
    });

  }

  if (asPipeline) {
    // if the transformation uses a "pipeline" strategy, then take the final output (nextInput) and return it
    // we only care about the output of each individual transform if it's the input for the next, and we're returning the final
    return nextInput;
  } else {
    return target;
  }

}

async function performWrite(dispatcher, context, input, target, writeTo, operatingOn) {

  let valueToOutput = operatingOn;

  if (!toTransform(writeTo, context, input)) {
    return;
  }

  if (writeTo.formatter) {
    const formatter = await resolveIdentifier(dispatcher, context, input, target, writeTo.formatter);
    if (typeof formatter === "function") {
      valueToOutput = formatter(valueToOutput);
      context.set("formattedValue", valueToOutput);
    }
  }

  let keyPath;
  // if writeTo is a string just use it as the path to write to
  if (typeof writeTo === "string") {
    keyPath = writeTo;
  } else {
    keyPath = await resolveIdentifier(dispatcher, context, input, target, writeTo.path);

    if (Array.isArray(keyPath)) {
      if (_.some(keyPath, isUndefinedOrNull)) {
        return undefined;
      }
      keyPath = _.join(keyPath, ".");
    }
  }

  if (writeTo.pathFormatter) {
    const formatter = await resolveIdentifier(dispatcher, context, input, target, writeTo.pathFormatter);
    if (typeof formatter === "function") {
      keyPath = formatter(keyPath, context);
      context.set("formattedPath", keyPath);
    }
  }

  if (writeTo.format) {
    valueToOutput = context.resolveVariables(writeTo.format);
  } else if (writeTo.value) {
    valueToOutput = context.resolveVariables(writeTo.value);
  }

  if (valueToOutput === undefined) {
    debug(`Not Writing (${JSON.stringify(valueToOutput)}) to (${keyPath})}`)
  } else {
    debug(`Writing (${JSON.stringify(valueToOutput)}) to (${keyPath}) on ${JSON.stringify(target)}`);

    // if undefined, my be trying to unset things, so don't do an undefined check (no use cases yet, add unit test)
    // if null, then definitely could be setting something to null

    if (writeTo.appendToArray) {
      let array = _.get(target, keyPath);
      if (isUndefinedOrNull(array) || !Array.isArray(array)) {
        array = [valueToOutput];
      } else {

        if (writeTo.appendToArray === "unique") {
          if (array.indexOf(valueToOutput) < 0) {
            array.push(valueToOutput);
          }
        } else {
          array.push(valueToOutput);
        }

      }

      _.set(target, keyPath, array);
    } else {
      _.set(target, keyPath, valueToOutput);
    }
  }

}

async function resolveIdentifier(dispatcher, context, input, target, identifier) {
  if (Array.isArray(identifier)) {
    const results = [];
    await asyncForEach(identifier, async (individualIdentifier) => {
      const result = await resolve(dispatcher, context, input, target, individualIdentifier);
      debug(`Resolved (${JSON.stringify(result)}) for: ${JSON.stringify(individualIdentifier)}`);
      results.push(result);
    });
    return results;
  }

  const result = await resolve(dispatcher, context, input, target, identifier);
  debug(`Resolved (${JSON.stringify(result)}) for: ${JSON.stringify(identifier)}`);
  return result;
}

async function resolve(dispatcher, context, input, target, identifier) {

  if (isUndefinedOrNull(identifier)) {
    return identifier;
  } else if (_.isPlainObject(identifier)) {
    // this is a pretty weak way to identify instructions, if there's a "component" field, then this transform won't work...
    // in those cases could use "static" component type which passes through a static object

    if (!identifier.component) {
      const keys = Object.keys(identifier);

      if (keys.length === 0) {
        return identifier;
      }

      const returnObj = {};

      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        let resolvedKey = key;
        if (typeof key === 'string') {
          resolvedKey = context.resolveVariables(key);
        }

        returnObj[resolvedKey] = await resolveIdentifier(dispatcher, context, input, target, identifier[keys[i]]);
      }

      return returnObj;
    }

  } else {
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
    resolvedObject = input;
  } else if (type === "target") {
    resolvedObject = target;
  } else if (type === "glue") {
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
    debug(`Selecting: ${JSON.stringify(selector)} from: ${JSON.stringify(resolvedObject)}`);
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
  performTransformation
};
