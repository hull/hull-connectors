/* @flow */

import type {
  ServiceTransforms
} from "./types";

const _ = require("lodash");

const {
  ServiceObjectDefinition
} = require("./types");

const {
  TransientError,
  LogicError
} = require("hull/src/errors");

const jsonata = require("jsonata");
const moment = require("moment");

const { TransformImpl } = require("./transform-impl");

const { HullInstruction, Route } = require("./language");
const HullVariableContext = require("./variable-context");
const { FrameworkUtils } = require("./framework-utils");
const { isUndefinedOrNull, getHullDataType, setHullDataType, createAnonymizedObject } = require("./utils");

const { ServiceEngine } = require("./service-engine");

const fs = require("fs");

const debug = require("debug")("hull-shared:engine");

const globalLocks = {};

class HullDispatcher {

  services: ServiceEngine;
  transforms: TransformImpl;
  glue: Object;
  ensure: string;
  ensurePromise: Promise<any>;

  // input transforms and services....
  // could have multiple services in the future... maybe take in an array?
  // really, we could run all of them in the same place potentially
  constructor(glue: Object, services: Object, transforms: ServiceTransforms, ensure: string) {
    this.glue = _.assign({}, glue, require("./glue-shared"));
    this.services = new ServiceEngine(this, services, transforms);
    this.ensure = ensure;
    this.transforms = new TransformImpl(transforms);
  }

  close() {
    this.services.close();
  }

  async dispatch(context: Object, route: string, data?: any) {

    if (process.env.STORE_REQUEST_TRACE) {
      const { organization, id, secret } = context.client.configuration();
      let dataToStore = data;
      const classType = getHullDataType(data);
      if (classType) {
        dataToStore = {
          data,
          classType
        };
      }
      context.request_trace = {
        configuration: {
          id,
          secret,
          organization,
          hostname: context.hostname,
          private_settings: context.connector.private_settings
        },
        route,
        input: dataToStore,
        serviceRequests: []
      };
    }
    try {
      const result = await this.handleRequest(new HullVariableContext(context), route, data);

      if (process.env.STORE_REQUEST_TRACE) {
        context.request_trace.result = result;
        fs.writeFileSync(`${process.env.STORE_REQUEST_TRACE}/${route}-${Date.now()}.json`, createAnonymizedObject(context.request_trace));
      }

      return result;

    } catch (error) {

      if (process.env.STORE_REQUEST_TRACE) {
        // TODO this doesn't serialize the error, need to figure out how to do that later
        context.request_trace.error = error;
        fs.writeFileSync(`${process.env.STORE_REQUEST_TRACE}/${route}-ERROR-${Date.now()}.json`, createAnonymizedObject(context.request_trace));
      }

      throw error;
    }
  }

  async dispatchWithData(context: Object, route: string, type?: ServiceObjectDefinition, data?: any) {

    if (!isUndefinedOrNull(data) && !isUndefinedOrNull(type)) {
      setHullDataType(data, type);
    }

    return await this.dispatch(context, route, data);
  }

  async handleRequest(context: HullVariableContext, route: string, data?: any) {

    // need to push a new context here so that we're not setting variables on the global context
    // remember, ensure route needs to share same variable space as primary route
    // because some connectors like marketo initialize variables that are used by all routes
    context.pushNew();
    if (!_.isEmpty(this.ensure)) {
      if (isUndefinedOrNull(this.ensurePromise)) {
        this.ensurePromise = this.resolve(context, new Route(this.ensure), data);
        await this.ensurePromise;
      } else {
        await this.ensurePromise;
      }
    }
    return await this.resolve(context, new Route(route), data);

  }

  async resolve(context: HullVariableContext, instruction: Object, serviceData?: any): any {

    if (instruction === undefined || instruction === null) {
      return instruction;
    }

    // need to handle array expansion or consolidation in the same place...
    // is array of instruction different than array of object returns?
    // maybe not....

    // array of instructions, those results together don't make much sense...
    // could be consolidating a variety of results from a variety of instructions
    // many of which don't have outputs...

    if (Array.isArray(instruction)) {
      const results = [];

      for (let index = 0; index < instruction.length; index++) {
        try {
          const result = await this.resolve(context, instruction[index], serviceData);
          results.push(result);
        } catch(err) {
          if (typeof err !== "SkippableArrayError") {
            throw err;
          }
        }
      }

      return results;
    } else if (instruction instanceof HullInstruction) {

      // an instruction could take in an array
      // but if it's single, then make array if endpoint takes an array
      // if it's an array, and endpoint takes 1, then loop over...

      // What are the differnces between input and parameters....
      // parameters are more downstream instructions that the input gets passed to first
      // this instruction only gets the result of the downstream objects...
      // are the hull input objects, the parameters to the route????!!!!
      // is that why route is the only object without parameters????!!!

      // what is the relationship between the route and the glue? What is the abstraction???

      let params = instruction.params;

      // Is this where we could detect if serviceData was an array
      // then resolve params one by one?
      let resolvedParams = await this.resolve(context, params, serviceData);

      let optionString;

      if (instruction.type === "logic") {
        optionString = instruction.options.name;
      } else {
        optionString = JSON.stringify(instruction.options)
      }

      if (!isUndefinedOrNull(params)) {

        let paramName = null;
        if (params instanceof HullInstruction) {
          paramName = `${params.type}:${params.options.name}`;
        } else  if (typeof params === 'string') {
          paramName = params;
        }

        let paramString = JSON.stringify(resolvedParams);
        if (paramString && paramString.length > 120) {
          paramString = `${paramString.substring(0, 120)}...`;
        }

        if (paramName === null) {
          debug(`[EXECUTING]: ${instruction.type}<${optionString}> [WITH-RESOLVED-PARAM]: ${paramString}`);
        } else {
          debug(`[EXECUTING]: ${instruction.type}<${optionString}> [FROM]: ${paramName} [WITH-RESOLVED-PARAM]: ${paramString}`);
        }

      } else {
        debug(`[EXECUTING]: ${instruction.type}<${optionString}>`);
      }

      const tracePaths = process.env.TRACE_PATHS;
      if (tracePaths) {
        _.forEach(_.split(tracePaths, ','), path => {
          if (path === instruction.options.name) {
            // TODO might be nice to have something that displayed all the options after resolved
            // could be a source of bugs...
            debug(`Instruction: ${JSON.stringify(instruction.options, null, 2)}`);
            debug(`Local Context: ${JSON.stringify(context.cloneLocalContext(), null, 2)}`);
          }
        })
      }

      const result = await this.interpretInstruction(context, instruction, resolvedParams, serviceData);

      //TODO not sure if we're ready for this yet, but we are kinda missing this
      // it kinda clutters the console, because for every instruction, we show 2 lines, sort of a going into the instruction
      // then coming back...
      // debug(`- [RESULT]: ${JSON.stringify(result)} [FROM]: ${instruction.type}<${optionString}>`);
      return result;
    } else {

      // otherwise we'll traverse the object itself and begin looking for instructions
      // and replacing variables
      // this sort of free evaluation is a little bit dangerous, but it makes the syntax in the language seem more intuative
      // more like building raw objects from instructions which may be lazily evaluated

      if (isUndefinedOrNull(instruction))
        return instruction;

      //
      if (typeof instruction === 'string') {
        return context.resolveVariables(instruction);
      } else if (!_.isPlainObject(instruction)) {
        return instruction;
      }

      const keys = Object.keys(instruction);
      const returnObj = {};

      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        let resolvedKey = key;
        if (typeof key === 'string') {
          resolvedKey = context.resolveVariables(key);
        }

        returnObj[resolvedKey] = await this.resolve(context, instruction[keys[i]], serviceData);
      }

      return returnObj;

    }


  }


  /**
   * There's an abtraction between serviceData (outgoing) and resolveParams(incoming) that needs to be clarified
   * It also provides a decent starting concept for joining data back together when doing things like batch operations...
   */
  async interpretInstruction(context: HullVariableContext, instruction: Object, resolvedParams: any, serviceData?: any) {

    const type = _.get(instruction, "type");
    const instructionOptions = instruction.options;
    const instructionName = instructionOptions.name;

    if (type === 'logic') {

      if (instructionName === 'if') {

        // if this instructions doesn't have any params, it's just a "do"
        let executeDo = true;

        const isTrue = (value) => {
          // undefined and null should both return false
          if (isUndefinedOrNull(value)) {
            return false;
          }
          return value;
        };

        // TODO can't do this if it's already been resolved....
        // but maybe can solve like cache?  build a set of instructions?
        // Can't do a "stop" after evaluation if it's already been evaluated...
        if (Array.isArray(instructionOptions.if)) {
          for (let i = 0; i < instructionOptions.if.length; i++) {
            const result = await this.resolve(context, instructionOptions.if[i], serviceData);
            if (!isTrue(result)) {
              executeDo = false;
              break;
            }
          }
        } else {
          const result = await this.resolve(context, instructionOptions.if, serviceData);
          executeDo = isTrue(result);
        }

        if (executeDo) {
          debug(`[EXECUTING]: Resolved -> if(true)`);
          return await this.resolve(context, instructionOptions.do, serviceData);
        } else {
          debug(`[EXECUTING]: Resolved -> if(false)`);
        }

        let elif = instructionOptions.elif;

        if (elif) {

          if (!Array.isArray(instructionOptions.elif)) {
            elif = [instruction.elif];
          }

          for (let i = 0; i < elif.length; i++) {
            const elifResult = await this.resolve(context, elif[i], serviceData);

            // if we get stop, that means that there was an "if" condition
            // and it did not validate, which meant we return stop
            if (elifResult.status !== "stop") {
              return {};
            }
          }
        }

        // have to check if undefined because could be wanting to return false to top
        // if(instructionOptions.eldo) would not execute if eldo=false
        if (instructionOptions.eldo !== undefined) {
          return await this.resolve(context, instructionOptions.eldo, serviceData);
        }

        return { status: "stop" };

      } else if (instructionName === "filter") {

        const dataType = getHullDataType(resolvedParams);
        let arrayToTraverse = resolvedParams;
        const results = [];

        for (let i = 0; i < arrayToTraverse.length; i += 1) {
          const param = arrayToTraverse[i];
          context.set(instructionOptions.key, param);
          const result = await this.resolve(context, instructionOptions.condition, serviceData);
          if (result) {
            results.push(param);
          }
        }

        if (dataType) {
          setHullDataType(results, dataType);
        }

        return results;

      } else if (instructionName === 'loop') {

        let loopIndex = 0;
        let loopKeys;
        let setKey;
        let setValue;

        // if the instruction has params and a varname it means we're looping over a predetermined object or array
        // here we're setting up the traversal and checking that the values make sense
        if (!isUndefinedOrNull(instruction.params) && instructionOptions.key) {
          // TODO not sure if we should throw error or not here... could quietly suppress... throwing for now...
          if (isUndefinedOrNull(resolvedParams)) {
            throw new Error(`Cannot iterate over a parameter that does not exist.  This instruction undefined: ${JSON.stringify(instruction.params)}`);
          } else if (!Array.isArray(resolvedParams) && !_.isPlainObject(resolvedParams)) {
            throw new Error(`Unable to iterate over this resolved param: ${JSON.stringify(resolvedParams)}`);
          }
          loopKeys = Object.keys(resolvedParams);
          setKey = await this.resolve(context, instructionOptions.key, serviceData);
          setValue  = await this.resolve(context, instructionOptions.value, serviceData);
        }

        // this means that we're iterating over a known array
        // and we've chosen to do it in an async way
        // will not respect loop ends...
        if (loopKeys && instructionOptions.async === true) {

          return Promise.all(_.map(loopKeys, key => {
            const shallowContextClone = context.shallowCloneContext();
            shallowContextClone.pushNew();
            //if the var name is an array, we assume we are trying to designate the value and key
            if (setValue) {
              shallowContextClone.set(setValue, resolvedParams[key]);
            }

            if (setKey) {
              shallowContextClone.set(setKey, resolvedParams[key]);
            }
            return this.resolve(shallowContextClone, instructionOptions.instructions, serviceData);
          }));
        }

        let finalInstruction;

        while(true) {

          // if iterating over a predetermined object or array
          if (loopKeys) {

            if (loopIndex >= loopKeys.length) {
              break;
            }

            //if the var name is an array, we assume we are trying to designate the value and key
            if (setValue) {
              // _.set(context, setValue, resolvedParams[loopKeys[loopIndex]]);
              context.set(setValue, resolvedParams[loopKeys[loopIndex]]);
            }

            if (setKey) {
              // _.set(context, setKey, resolvedParams[loopKeys[loopIndex]]);
              context.set(setKey, resolvedParams[loopKeys[loopIndex]]);
            }

            loopIndex += 1;
          }
          try {
            const instructionResults = await this.resolve(context, instructionOptions.instructions, serviceData);
            //results.push(instructionResults);
            // if results do not contain an end(), then continue to loop
            let endInstruction;
            const isEnd = (someResult) => {
              return someResult instanceof HullInstruction && someResult.options.name === "end";
            };

            if (Array.isArray(instructionResults)) {
              // check to see if includes an end, if so, then stop looping...
              endInstruction = _.find(instructionResults, isEnd);
            } else if (!isUndefinedOrNull(instructionResults) && isEnd(instructionResults)) {
              endInstruction = instructionResults;
            }

            if (!isUndefinedOrNull(endInstruction)) {
              break;
            } else {
              finalInstruction = instructionResults;
            }
          } catch(err) {
            if (typeof err !== "BreakToLoop") {
              throw err;
            }
          }
        }

        // Not sure what the exact behavior to return from a loop is
        // But we know it's not to return the results of the whole loop
        // got into several situations where returning the result of all instructions in a loop
        // filled up memory quickly, especially on initial synch/paging type operations
        return Promise.resolve(finalInstruction);


      } else if (instructionName === 'end') {
        return instruction;
      } else if (instructionName === 'lock') {
        const lockname = context.resolveVariables(instructionOptions.lockname);
        if (globalLocks[lockname]) {

          // TODO not sure what to throw here... it's sort of a special type of locking behavior
          // if you want it to completely stop if you don't get it
          // may roll behavior into cache lock and deprecate this
          // either way, this is an issue with the warehouse connector that must stop if the lock is in use
          // especially with the status endpoint where we try to detect this and suppress the message (temporarily?)
          throw new TransientError(`[${lockname}] already in use`);
        } else {
          globalLocks[lockname] = true;
          try {
            return await this.resolve(context, instructionOptions.instructions, serviceData);
          } finally {
            globalLocks[lockname] = false;
          }
        }
      } else {
        throw new Error(`Unsupported Logic: ${instructionName}`);
      }

    } else if (instruction.type === "cache") {

      const cache = context.reqContext().cache;
      if (!cache)
        throw new Error("Calling a cache command, but cache isn't present");

      const optionsToResolve = _.pick(instructionOptions, ["ttl", "key", "refresh"]);
      const cacheResolvedOptions = await this.resolve(context, optionsToResolve, serviceData);
      const cacheOptions = { ttl: cacheResolvedOptions.ttl };
      const cacheKey = cacheResolvedOptions.key;

      if (instructionOptions.name === "set") {
        // todo using the value is wrong because it's not dynamically evaluated
        // but try for now to get full fetch to run
        // not sure what above comment means, clarify if you remember at some point

        // always store with data type if it exists, then can hydrate it when coming back out
        const valueToCache = { cacheValue: resolvedParams, dataType: getHullDataType(resolvedParams) };
        await cache.set(cacheKey, valueToCache, cacheOptions);
        return resolvedParams;
      } else if (instructionOptions.name === "get") {

        const result = await cache.get(cacheKey);

        if (isUndefinedOrNull(result))
          return result;

        // set with the "dataType" if it exists
        const cacheValue = result.cacheValue;
        setHullDataType(cacheValue, result.dataType);
        return cacheValue;

      } else if (instructionOptions.name === "lock") {

        const lockCacheKey = `HULL-CACHE-LOCK(${cacheKey})`;
        const lock = await cache.get(lockCacheKey);

        if (lock) {
          // someone else has lock
          return false;
        }

        let cacheLockRefresh = null;
        await cache.set(lockCacheKey, true, cacheOptions);

        try {

          //refresh the lock every once in a while so that if we keep checking that we're still processing
          const setLock = () => {
            debug("[EXECUTING]: Refreshing lock: " + lockCacheKey);
            cache.set(lockCacheKey, true, cacheOptions)
              .then(() => {
                // only do this if the previous timeout reference is in there
                // otherwise we may have been in "set" while it was being cleared
                if (cacheLockRefresh !== null) {
                  debug("[EXECUTING]: Scheduling next lock refresh: " + lockCacheKey);
                  cacheLockRefresh = setTimeout(setLock, cacheResolvedOptions.refresh);
                }
              });
          }

          cacheLockRefresh = setTimeout(setLock, cacheResolvedOptions.refresh);

          if (instructionOptions.instructions) {
             return await this.resolve(context, instructionOptions.instructions, serviceData);
          }
        } finally {
          debug(`Clearing Lock: ${lockCacheKey}`)
          // clear the timeout in all cases even if we throw an error
          clearTimeout(cacheLockRefresh);
          cacheLockRefresh = null;
          await cache.del(lockCacheKey);
        }

        return false;

      } else {
        throw Error("Cache instruction not supported: " + JSON.stringify(instruction));
      }

    } else if (type === 'reference') {

      if (instructionName === 'input') {
        if (!isUndefinedOrNull(serviceData) && !isUndefinedOrNull(instructionOptions.path)) {
          const path = context.resolveVariables(instructionOptions.path);
          return _.get(serviceData, path);
        }
        return serviceData;
      }

      throw new Error(`Unsupported Reference: ${instructionName}`);

    } else if (type === 'route') {

      const route = this.glue[instructionName];

      if (isUndefinedOrNull(route)) {
        throw new Error(`Route: ${instructionName} not found in glue`);
      } else if (_.isEmpty(route)) {
        return Promise.resolve(route);
      }

      // if there was a param in the route, pass that as the service data
      if (instruction.params) {
        return await this.resolve(context, route, resolvedParams);
      } else {
        return await this.resolve(context, route, serviceData);
      }

    } else if (type === 'operation') {

      const opInstruction = await this.resolve(context, instructionOptions, serviceData);

      // This first block is for special operations that have potentially a variable number of arguments
      if (Array.isArray(resolvedParams)) {

        if (opInstruction.name === 'isEqual') {
          return _.isEqual(...resolvedParams);
        } else if (opInstruction.name === "lodash") {
          return _[resolvedParams[0]](..._.slice(resolvedParams, 1));
        } else if (opInstruction.name === "moment") {
          return moment(...resolvedParams);
        } else if (opInstruction.name === "lessThan") {
          return resolvedParams[0] < resolvedParams[1];
        } else if (opInstruction.name === "greaterThan") {
          return resolvedParams[0] > resolvedParams[1];
        } else if (opInstruction.name === 'ex') {

          return resolvedParams[0][resolvedParams[1]](..._.slice(resolvedParams, 2));

          // TODO Not sure this is the right behavior
          // May make sense for instructions like this:
          // cacheSet("completedJobIds", ex(cacheGet("completedJobIds"), "push", "${exportId}"))
          // But it makes the result of the instruction a little funky depending on the situation
          // But I don't know how to do that instruction in a way that isn't a lot worse without this code...

          //This didn't work for the [] push command because array.push returns the length of the new array anyway
          // if (isUndefinedOrNull(results))
          //   return input[0];
          //
          // return results;

        }

      }

      let obj = resolvedParams;

      if (opInstruction.name === "get") {

        if (typeof opInstruction.key !== "string") {
          throw new LogicError(`ERROR: Key is not resolved to a string: ${JSON.stringify(instructionOptions)}`);
        }

        if (!obj) {
          return context.get(opInstruction.key);
        }

        return _.get(obj, opInstruction.key);

      } else if (opInstruction.name === "set") {

        // TODO NEED TO HAVE A GLOBAL SET WITH THIS NEW CONTEXT STUFF
        // otherwise could put the variables like new tokens in a local context...

        // TODO might need some additional validation, could potentially
        // get into a non-intuative situation where you set an object as key
        // in which case, we'll set multiple things in the context, like normal
        // but if something was also put into the params, it would not be set, and wouldn't be intuative
        // based on this logic
        if (_.isPlainObject(opInstruction.key)) {

          _.forEach(opInstruction.key, (value, key) => {
            // _.set(context, key, value);
            context.set(key, value);
          });

        } else {
          // interesting that for set, we're only ever setting on context
          // whereas get allows us to get keys on other objects...
          // TODO maybe we should add that to set?
          // _.set(context, opInstruction.key, resolvedParams);
          context.set(opInstruction.key, resolvedParams);
        }

        return resolvedParams;
      } else if (opInstruction.name === 'cast') {

        // interesting problem if we're using the same input everywhere and "recasting" it...
        // should maybe do a shallow clone and recast so it doesn't affect other parent or sibling routes

        const castObj = _.clone(obj);
        setHullDataType(castObj, opInstruction.type);
        return castObj;

      } else if (opInstruction.name === "transformTo") {

        // Don't want to break out and do obj by obj transform here
        // because jsonata might be doing that for us...
        // not sure what the abstraction is here...
        // need to be consistent
        // by doing this, broke attribute transformation, because using jsonata on an array
        // but breaks batch transformation and sending to leadupsert
        // probably depends on the operation, should let transformer apply this logic...
        // let result;
        // if (Array.isArray(obj)) {
        //   result = obj.map(singleObject => {
        //     return this.transforms.transform(context, singleObject, objType, opInstruction.resultType);
        //   });
        // } else {
        //   result = this.transforms.transform(context, obj, objType, opInstruction.resultType);
        // }

        return await this.transforms.transform(this, context, obj, opInstruction.resultType);

      } else if (opInstruction.name === "jsonata") {

        const expression = jsonata(opInstruction.expression);
        return expression.evaluate(obj);

      } else if (opInstruction.name === 'filter') {

        return _.filter(obj, opInstruction.truthyFilter);

      } else if (opInstruction.name === 'notFilter') {

        return _.reject(obj, opInstruction.truthyFilter);

      } else if (opInstruction.name === 'notEmpty') {

        return (typeof obj === 'number') || !_.isEmpty(obj);

      } else if (opInstruction.name === 'isEmpty') {

        return (typeof obj !== 'number') && _.isEmpty(obj);

      } else if (opInstruction.name === 'utils') {
        //passing the req context because that's where things like the client, configuration and cache are
        return new FrameworkUtils()[opInstruction.utilMethod](context.reqContext(), obj);
      } else if (opInstruction.name === 'allTrue') {

        if (!Array.isArray(obj)) {
          return obj === true;
        }

        for (let i = 0; i < obj.length; i++) {
          if (!obj[i])
            return false;
        }

        return true;
      } else if (opInstruction.name === 'obj') {

        return obj;

      } else if (opInstruction.name === 'not') {

        return !obj;

      } else if (opInstruction.name === 'inc' && typeof obj === 'number') {

        return obj + 1;

      }

      throw new Error(`Operation ${opInstruction.name} contains invalid format with params: ${JSON.stringify(resolvedParams)}`);

    } else if (type === 'service') {

      return await this.services.resolveInstruction(context, instruction, resolvedParams);

    } else {
      throw new Error("Unsupported type: " + type);
    }

  }

}

module.exports = {
  HullDispatcher
};
