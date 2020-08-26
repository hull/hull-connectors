/* @flow */
import type { HullContext } from "hull";

const { doVariableReplacement } = require("./variable-utils");
const { isUndefinedOrNull } = require("./utils");

const _ = require("lodash");

class HullVariableContext {
  hullContext: HullContext;
  localContext: Array<Object>;

  constructor(reqContext: HullContext) {
    this.hullContext = reqContext;
    this.localContext = [];
  }

  pushNew(context?: Object) {
    if (context) {
      this.localContext.push(context);
    } else {
      this.localContext.push({});
    }
  }

  popLatest() {
    if (!_.isEmpty(this.localContext)) {
      this.localContext.pop();
    }
  }

  get(key: string) {
    // TODO might potentially try to detect if the first object on the path exists as a key in the context
    // may not have the whole path, but if just top level is there, return undefined
    // same thing for keys whose value is explicitly "undefined" where we may want to return that...

    const rootKey = _.first(_.split(key, "."));
    // let foundRootObject = false;

    for (let i = this.localContext.length - 1; i >= 0; i -= 1) {
      const currentContext = this.localContext[i];
      const value = _.get(currentContext, key);
      if (value !== undefined) {
        return value;
      }

      const keys = Object.keys(currentContext);
      if (keys.indexOf(rootKey) >= 0) {
        // console.log(`Returning undefined because root key is present in context: ${rootKey} for ${key}`);
        return value;
      }

      // foundRootObject = this.logBadBehavior(currentContext, value, rootKey, key, foundRootObject, i);
    }

    const hullValue = _.get(this.hullContext, key);

    // this.logBadBehavior(this.hullContext, hullValue, rootKey, key, foundRootObject);

    return hullValue;
  }

  logBadBehavior = (
    context,
    value,
    rootKey,
    fullKey,
    foundRootObject,
    index
  ) => {
    try {
      if (!isUndefinedOrNull(rootKey)) {
        const keys = Object.keys(context);
        if (keys.indexOf(rootKey) >= 0) {
          if (foundRootObject) {
            console.log(
              `[${index}]Parent Overwriting child behavior present for: ${rootObject} on path: ${fullKey}`
            );
          }

          const rootValue = _.get(context, rootKey);
          if (isUndefinedOrNull(rootValue)) {
            // console.log(`[${index}]Undefined Root object: ${rootKey} is: ${rootValue} for keypath: ${fullKey}`);
          }

          return true;
        }
      }
    } catch (err) {}
    return false;
  };

  set(key: string, value: any) {
    if (_.isEmpty(this.localContext)) {
      _.set(this.hullContext, key, value);
    } else {
      _.set(_.last(this.localContext), key, value);
    }
  }

  setOnHullContext = (key: string, value: any) =>
    _.set(this.hullContext, key, value);

  reqContext = () => this.hullContext;

  createFlattenedContext() {
    return {
      ...this.hullContext,
      ...this.localContext
    };
  }

  cloneLocalContext() {
    return _.cloneDeep(this.localContext);
  }

  shallowCloneContext() {
    const shallowClone = new HullVariableContext(this.hullContext);
    this.localContext.map(context => shallowClone.pushNew(context));
    return shallowClone;
  }

  resolveVariables(key: string, localContext?: Object) {
    if (localContext) {
      this.pushNew(localContext);
      try {
        return doVariableReplacement(this, key);
      } finally {
        this.popLatest();
      }
    }
    return doVariableReplacement(this, key);
  }
}
module.exports = HullVariableContext;
