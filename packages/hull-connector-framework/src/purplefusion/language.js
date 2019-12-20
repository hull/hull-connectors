/* @flow */

import type { ServiceObjectDefinition } from "./types";

const _ = require("lodash");
const hash = require('object-hash');

class HullInstruction {

  type: string;
  name: string;

  // options are the values that guide the instruction
  // evaluated right before instruction execution
  // Certain instructions like "Logic" could have control over the evaluation of the options
  // TODO options aren't just dumped into evaluation?
  options: any;

  // params are the input for the instruction, which are evaluated first
  params: any;

  /**
   * A HullInstruction is the base class for all instruction types
   *
   * @constructor
   * @param {string} type - The type of instruction it is
   * @param {any} options - these are all of the options needed to execute an instruction of a particular type
   * @param {any}  params - these are the parameters to be evaluated before this instruction is executed.  their result is to be passed to this instruction
   */
  constructor(type: string, options: string | Object, params?: any) {
    this.type = type;
    // this.name = name;

    if (typeof options === "string") {
      this.options = { name: options };
    } else {
      this.options = options;
    }

    this.params = params;
  }
}

// input 1/*
// output 1/* probably....
//Could evaluate an individual or an array as input
//like a fancy goto used only in glue...
class Route extends HullInstruction {
  constructor(name: string, params?: any) {
    super("route", name, params);
  }
}

function route(name: string, params?: any): Route {
  return new Route(name, params);
}

// May roll this up somewhere else... only one, maybe combine with if?
class InputReference extends HullInstruction {
  constructor(path?: string) {
    super("reference", { name: "input", path } );
  }
}

/**
 * This instruction is the way we reference the input into the route
 * could be data that was sent to the route by Hull/Service, or could be data that we sent to the route
 * or could have been manually sent using the route(routename, datatosetasinput) command
 * @param path
 * @returns {InputReference}
 */
function input(path?: string): InputReference {
  return new InputReference(path);
}

// input: 1/*
// output: 1/*
// Also typically evaluated with 1 input, not an array
// but could be an array on the incoming... think filter...
class Op extends HullInstruction {
  constructor(options: string | { name: string }, params: any) {
    super("operation", options, params);
  }
}

/**
 * This is a special operation where we can put multiple parameters that are then passed in as an array
 * this specific instruction is used to evaluate booleans typically for an ifL instruction
 * but may be a multi-purpose way to specify multiple parameters to pass to a instruction, without having to create an array
 * @param name
 * @param settings
 * @returns {Op}
 */
function cond(name: string, ...params: Array<any>): Op {

  //TODO not sure if this is the right thing or not...
  // probably depends on the context, but if there's only 1 parameter, I'm not going to make this an array
  //const settings = Array.from(arguments);

  if (params.length === 1) {
    return new Op({ name }, params[0]);
  }
  else if (params.length < 1) {
    return new Op({ name });
  }

  return new Op({ name }, params);
}

/**
 * Meant to easily negate any condition or boolean expression which may be returned
 * @param params
 * @returns {Op}
 */
function not(...params: Array<any>): Op {
  return cond("not", ...params);
}

/**
 * This method specifically passes any input parameters to a lodash function
 * where the first parameter is the lodash method, and any following inputs are the parameters for that lodash function
 * @returns {Op}
 */
function ld(): Op {
  return new Op({ name: "lodash" }, Array.from(arguments));
}

/**
 * This method can instantiate using the moment constructors, used for time manipulation
 * @returns {Op} a call to the moment library
 */
function moment(): Op {
  return new Op({ name: "moment" }, Array.from(arguments));
}

/**
 * This is a instruction for calling methods on objects which have been evaluated
 * use sparingly....
 * first parameter is the object to call the method on
 * second parameter is the method to call
 * any additional inputs are passed as parameters to the method being called
 * @returns {Op}
 */
function ex(): Op {
  return new Op({ name: "ex"} , Array.from(arguments));
}

/**
 * This method is to take any data returned from a service, or created by instructions
 * and cast it to a particular object type as described by a ServiceObjectDefinition
 * all of the type's attributes will now be associated with that data
 * it will be used to determine implicit transformations and additional implicit features as we develop them
 * @param type class which extends ServiceObjectDefinition
 * @param params a data structure or instruction which returns a data structure to be cast
 * @returns {Op}
 */
function cast(type: any, params: any): Op {
  return new Op({ name: "cast", type }, params);
}

/**
 * This instruction sets a variable in the context of this request
 * the variable can thereby be referenced using ${variablename}, within substrings
 * if referenced as the only think in a string like this: "${variablename}" that object
 * will be pulled directly, otherwise, if surrounded by other string characters in a string
 * it will be converted into a string and the entire string will be returned
 *
 * @param key
 * @param value
 * @returns {Op}
 */
function set(key: any, value: any): Op{
  return new Op({ name: "set", key }, value);
}

/**
 * This method gets a particular key from an object that is evaluated lazily
 * @param key is the parameter that we'll be searching for in obj
 * @param obj can be a object or an instruction that is to be evaluated.  Object is required, if you're trying to get a variable from the context,
 * you don't need to use get, just use variable replacement syntax
 * Though could potentially use a get with key only if you wanted to pull from the context, but wanted to use variable replacement to get a dynamiclly built path
 * -> like traversing a claims field
 * @returns {Op}
 */
function get(key: string, obj: any): Op {
  return new Op({ name: "get", key }, obj);
}

// only reason params get resolved properly is because they are in an array
// and we have special logic for processing arrays
// and because arrays almost by definitely have 1 level
// any second level would then be processed as an array too
// do we want to have that same functionality with objects too????
function transformTo(resultType: ServiceObjectDefinition, param: any) {
  return new Op({ name: "transformTo", resultType }, param);
}

function jsonata(expression: string, param: any) {
  return new Op({ name: "jsonata", expression}, param);
}

// Might not need this method anymore...
// if we kind of evaluate everything as objects now...
function obj(object: any): Op {
  return new Op({ name: "obj" }, object);
}

/**
 * This method receives an object and adds 1 to it.  Should receive a number
 * @param object
 * @returns {Op}
 */
function inc(object: any): Op {
  return new Op({ name: "inc" }, object);
}

/**
 * this uses lodash filter moethod
 * @param truthyFilter
 * @param toFilter
 * @returns {Op}
 */
function filter(truthyFilter: any, toFilter: any): Op {
  return new Op({ name: "filter", truthyFilter }, toFilter);
}

/**
 * This uses the lodash reject method
 * @param truthyFilter
 * @param toFilter
 * @returns {Op}
 */
function notFilter(truthyFilter: any, toFilter: any): Op {
  return new Op({ name: "notFilter", truthyFilter }, toFilter);
}
function utils(utilMethod: string, param: any): Op {
  return new Op({ name: "utils", utilMethod}, param);
}


// input: 1/* could evaluate an array or a single object as input
// output: 1/*
class Svc extends HullInstruction {
  constructor(options: { name: string, op: string }, params: any) {
    super("service", options, params);
  }
}

function hull(op: string, params: any): Svc {
  return new Svc({ name: "hull", op}, params);
}


// Each of these seem like arbitors for the type of data that each of these need
// if we remove them, then the functions themselves will have to do that...
// maybe
// All logic classes essentially have a different execution pattern
// potentially where something is evaluated up front to determine
// the path of param evaluation...
// may switch the concepts of params vs options
// possibly options evaluated first?
class Logic extends HullInstruction {
  constructor(options: { name: string }, params?: any) {
    super("logic", options, params);
  }
}

/**
 * This is one of the core control structures for this language
 * the first parameter is evaluated, and the rest are decided based on that evaluation
 *
 * Could potentially simplify syntax if there was only 1 do
 * might not need to specify "do", just put the instruction, it would need to be special to invoke do/eldo
 * would need to pass it the resultant if boolean?  Not sure if that abstraction is clear yet....
 * same potential simplication for finallyL
 *
 * @param params these are the conditions which are evaluated then passed back to the logic to decide what to execute next,
 * must return a boolean value to control the logic
 * @param results must pass back an object of type that has a do syntax, potentially make eldo mandatory, otherwise, with just a single do,
 * could have just passed the instruction
 * @returns {Logic}
 */
function ifL(params: any, results: any | { do: any, eldo?: any, elif?: any }): IfLogic {

  let toEvaluate = results;
  // if do isn't present in the results, then build one to make the underlying evaluation code simpler
  // this is just a way to give the instruction syntax simplicity on top, so that if only a "do" exists, then we just can pass the next instruction
  if (results.do === undefined) {
    toEvaluate = { do: toEvaluate };
  }

  return new Logic({ name: "if", if: params, ...toEvaluate });
}


/**
 * This instruction creates an "or" functionality from existing instructions
 * Not sure if this is the best way to do it, but I like that we build on existing functionality
 * and are not introducing new concepts to the core logic
 * if any one of the conditions evaluates to true, we stop and return true
 * could actually simulate "and" as well this way
 * @param conditions
 * @returns {IfLogic|boolean} returns a set of instructions that will evaluate to true or false
 */
function or(conditions: Array<any>) {
  // TODO need to maybe rethink this signature, or make sure it fails if there's not an array
  // did a or(condition, condition) and it failed silently...
  // maybe throw an error here if the conditions are not an array?
  if (_.isEmpty(conditions)) {
    return false;
  }

  return ifL(_.first(conditions), {
    do: true,
    eldo: or(_.slice(conditions, 1))
  });
}

/**
 * This is a way to filter an array based on glue logic which is applied to each object in the array
 *
 * @param condition this is a glue instruction that must evaluate to true or false per object in the array traversed
 * @param key this is the name of variable for the current object that we're traversing in the array
 * @param array this is the array to traverse, and the result will be a filtered array where any object not matching the condition logic will be removed
 * @returns {Logic} when this instruction ins evaluated, any object where the condition returns false, will be removed from the array
 */
function filterL(condition: any, key: string, array: any) {
  return new Logic({ name: "filter", key, condition }, array);
}

class LockLogic extends Logic {
  constructor(lockname: string, instructions: any) {
    super({ name: "lock", instructions, lockname });
  }
}

/**
 * This instruction creates an inmemory lock on "lockname"
 * meaning that if another request tries to get the same lock while an original holds it
 * that request will fail.  acts like a mutex, can expand on functionality if needed
 * cacheLock is a similar instruction, but uses a stored value in the cache instead of an in memory value
 * @param lockname -> name of the lock that you want to try to get
 * @param instructions -> instructions to run if you get the lock, and once these instructions are complete, we release the lock
 * @returns {LockLogic}
 */
function lockL(lockname: string, instructions: any): LoopLogic {
  return new LockLogic(lockname, instructions);
}


class LoopLogic extends Logic {
  constructor(instructions: any, collection?: any, variables?: { key: string, value?: string }) {

    const additionalParameters = {};
    _.assign(additionalParameters, variables);

    // can be the same container for an input array and for dynamic loop
    // dynamic loop the params are null... we just keep looking...
    super({ name: "loop", instructions, ...additionalParameters }, collection);
  }
}

/**
 * This is an instruction which continues to loop on the instruction(s) that we put in
 * loop will end when it detects a loopEndL() was encountered
 * Please not that there is a known issue where if we are looping on an array of some sort,
 * the full array will be evaluated before we can search for the loopEndL()
 * so if a loopEndL() occurred, but then some instructions after, those instructions are evaluated
 * It works best if determining if the loopEndL() should be pushed as the last condition in a sequence of instructions
 *
 * @param instructions
 * @returns {LoopLogic}
 */
function loopL(instructions: any): LoopLogic {
  return new LoopLogic(instructions);
}

// //deprecate superceeded by iterate
// function loopArrayLogic(arrayParam: any, varname: string, instructions: any): LoopLogic {
//   return new LoopLogic(instructions, arrayParam, varname);
// }

/**
 * Use this method to iterate over an array while calling the instructionstransformTo
 * for each object in the arrayParam
 *
 * This is a good example of a method which changes the order of right to left evaluation
 * in order for calling the instruction to make more sense....
 * @param arrayParam the array to iterate over. In this case this array Param is evaluated first
 * @param varname variable name to set for each object of the array as it evaluates the instructions
 * key will set the name of the variable that will hold the key name if we're iterating over an object, or index if array
 * value will set the name of the variable that will hold the value that we're currently iterating on
 * async is a special value which will resolve the array all at the same time in an async way.  Will not respect loopEnds...
 * this also means that any variables declared inside of the async context will not bubble out, but and variables before will hold their previous values even if set again in the async context
 * @param instructions the instructions to evaluate for each of the objects in the array
 *
 * // TODO key and value should be switched or changed to be more explicit to what they actually do, seems kinda wrong the way it is now
 * @returns {LoopLogic}
 */
function iterateL(arrayParam: any, varname: string | { key: string, value?: string, async?: boolean }, instructions: any): LoopLogic {

  let variables;
  if (typeof varname === "string") {
    variables = { key: varname };
  } else {
    variables = varname;
  }
  return new LoopLogic(instructions, arrayParam, variables);
}

/**
 * This instruction is like a break for a loop, but didn't want to use "break" language
 * instead the prefix references the loop that it's trying to end
 * @returns {Logic}
 */
function loopEndL(): Logic {
  return new Logic({ name: "end" });
}

function returnValue(instructions: any, returnValue: any) {
  return new Logic({ name: "return", instructions, returnValue });
}

/**
 * helper function for easily referencing variables from the private settings
 * without having to call connector.private_settings from all over the place
 * @param key this is the key to resolve in the private settings
 * @returns {Op}
 */
function settings(key: any): Op {
  return get(`connector.private_settings.${key}`);
}

/**
 * Helper function for setting values in the private settings
 * caller may set one value by specifying a key and a value
 * or may set multiple by passing in an object as "key" which will set all of the key values
 * in the object as settings
 *
 * @param key
 * @param value
 * @returns {Op}
 */
function settingsSet(key: any, value?: any) {
  if (value === undefined) {
    const obj = {};

    _.forEach(key, (value, name) => {
      obj[`connector.private_settings.${name}`] = value;
    });

    return new Op({ name: "setOnHullContext", key: obj });
  } else {
    // return set(key, value);
    return new Op({ name: "setOnHullContext", key }, value);
  }
}

/**
 * Helper function to not only update the in-memory settings which we're currently using
 * but also updating the connector settings as well, ensuring we're in sync with the latest update
 * @param key
 * @param value
 * @returns {*[]}
 */
function settingsUpdate(key: any, value?: any) {
  if (value === undefined) {
    return [ settingsSet(key), hull("settingsUpdate", key) ];
  } else {
    return [ settingsSet(key, value), hull("settingsUpdate", { [key]: value }) ];
  }

}


class Cache extends HullInstruction {
  constructor(options: { name: string }, params: any) {
    super("cache", options, params);
  }
}

/**
 * This is a helper method which creates a "cachewrap" logic with get and set methods
 * @param param (this is the parameter to eve
 * @param expiration
 * @returns {*|IfLogic}
 */
function cacheWrap(expiration: number, param: any) {

  // TODO need to find a better way to do cache key for wrapping methods
  // just ran into a bug where the key wasn't unique enough... will cause really weird issues...
  // return ifL(
  //   cond("isEmpty", set("hull-internal-cacheWrappedValue", cacheGet(`${param.type}|${param.options.name}|${param.options.op}`))),
  //   {
  //     do: cacheSet({ ttl: expiration, key: `${param.type}|${param.options.name}|${param.options.op}`}, param),
  //     eldo: "${hull-internal-cacheWrappedValue}"
  //   });
  //TODO key could be JSON.stringify(param) -> then could MD5 that....
  return new Cache({name: "wrap", key: cacheKeyForInstruction(param), ttl: expiration, instruction: param });
}

function cacheDel(param: any) {
  return new Cache({ name: "del", key: cacheKeyForInstruction(param) });
}

function cacheKeyForInstruction(instruction: any) {
  return hash(instruction);
}

function cacheGet(key: string) {
  return new Cache({ name: "get", key });
}

/**
 * Method for setting a value in the cache.  Cache is an in-memory cache by default, which needs to be considered
 * if using multiple dynos, but if you create a Redis Cache and set REDIS_URL, the dynos will share that cache
 * rather than their individual in-memory ones
 * @param keyOrOptions May be the key to set in which case ttl is set to -1 by default, otherwise an object of key value pairs that are passed as options
 * @param value
 * @returns {Cache}
 */
function cacheSet(keyOrOptions: string | { key: string }, value: any) {

  let ttl = 0;
  let key;

  if (typeof keyOrOptions === "string") {
    key = keyOrOptions;
  } else {
    key = keyOrOptions.key;

    if (typeof keyOrOptions.ttl === "number") {
      ttl = keyOrOptions.ttl;
    }
  }


  return new Cache({ name: "set", key, ttl }, value);
}

/**
 * This is a special method which attempts to get a "lock" using the cache.  Logic is implemented
 * where the return value is a boolean which says whether we got the lock
 * if we did get the lock, we try to refresh every so often, with an ultimate timeout
 * refresh is something we don't expose right now, it's says we refresh the lock every X milliseconds
 * ttl is set at 60, where if we don't refresh (if the dyno was restarted or something else), then we release
 * the lock after a max of 60 seconds
 * @param key
 * @returns {Cache}
 */
function cacheLock(key: any, instructions: any) {
  return new Cache({ name: "lock", key, refresh: 5000, ttl: 60, instructions });
}




// not filter...

module.exports = {
  HullInstruction,
  Route,
  Svc,
  cast,
  input,
  route,
  cond,
  not,
  hull,
  set,
  get,
  obj,
  filter,
  notFilter,
  utils,
  ifL,
  or,
  lockL,
  iterateL,
  loopL,
  loopEndL,
  filterL,
  settings,
  settingsUpdate,
  cacheWrap,
  cacheSet,
  cacheGet,
  cacheLock,
  cacheDel,
  transformTo,
  jsonata,
  ld,
  moment,
  ex,
  inc,
  returnValue
};
