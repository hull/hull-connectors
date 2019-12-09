/* @flow */
import type { HullContext } from "hull";

const { doVariableReplacement } = require("./variable-utils");

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
    for (let i = this.localContext.length - 1; i >= 0; i -= 1) {
      const value = _.get(this.localContext[i], key);
      if (value !== undefined) {
        return value;
      }
    }
    return _.get(this.hullContext, key);
  }


  set(key: string, value: any) {
    if (_.isEmpty(this.localContext)) {
      _.set(this.hullContext, key, value);
    } else {
      _.set(_.last(this.localContext), key, value);
    }
  }

  reqContext() {
    return this.hullContext;
  }

  createFlattenedContext() {
    return _.assign({}, this.hullContext, ...this.localContext);
  }

  cloneLocalContext() {
    return _.cloneDeep(this.localContext);
  }

  shallowCloneContext() {
    const shallowClone = new HullVariableContext(this.hullContext);
    this.localContext.map(context => {
      shallowClone.pushNew(context);
    });
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
