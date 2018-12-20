/* @flow */

class HullInstruction {
  type: string;
  name: string;
  constructor(type: string, name: string) {
    this.type = type;
    this.name = name;
  }
}

// input 1/*
// output 1/* probably....
//Could evaluate an individual or an array as input
//like a fancy goto used only in glue...
class Route extends HullInstruction {
  params: any;
  paramsType: any;
  constructor(name: string, params: any, paramsType: any) {
    super("route", name);
    this.params = params;
    this.paramsType = paramsType;
  }
}

// input: 1/*
// output: 1/*
// Also typically evaluated with 1 input, not an array
// but could be an array on the incoming... think filter...
class Op extends HullInstruction {

  params: any;

  constructor(name: string, params: any) {
    super("operation", name);
    this.params = params;
  }
}

// input: 1/* could evaluate an array or a single object as input
// output: 1/*
class Svc extends HullInstruction {
  op: string;

  params: any;

  constructor(name: string, op: string, params: any) {
    super("service", name);
    this.op = op;
    this.params = params;
  }
}

class Logic extends HullInstruction {

  params: any;

  constructor(name: string, params: any) {
    super("logic", name);
    this.params = params;
  }
}

class IfLogic extends Logic {

  results: any;
  constructor(params: Op, results: { true: any, false: any }) {
    super("if", params);
    this.results = results;
  }
}

class LoopLogic extends Logic {
  // can be the same container for an input array and for dynamic loop
  // dynamic loop the params are null... we just keep looking...
  instructions: any;
  varname: string;
  constructor(params: any, varname: string, instructions: any) {
    super("loop", params);
    this.varname = varname;
    this.instructions = instructions;
  }
}

class FunctionLogic extends Logic {
  toExecute: Function;
  constructor(params: any, toExecute: Function) {
    super("function", params);
    this.toExecute = toExecute;
  }
}

// May roll this up somewhere else... only one, maybe combine with if?
class InputReference extends HullInstruction {
  path: string;
  constructor(path?: string) {
    super("reference", "input");
    if (path !== undefined)
      this.path = path;
  }
}

function input(): InputReference {
  return new InputReference();
}

function inputParameter(path: string): InputReference {
  return new InputReference(path);
}

function route(name: string): Route {
  return new Route(name, undefined, undefined);
}

function routeWithData(name: string, params: any, paramsType: any): Route {
  return new Route(name, params, paramsType);
}

function cond(name: string, params: any): Op {
  return new Op(name, params);
}
function hull(op: string, params: string | Object): Svc{
  return new Svc("hull", op, params);
}
function set(key: any, value: any): Op{
  return new Op("set", [ key, value ]);
}
function get(obj: any, key: any): Op {
  return new Op("get", [ obj, key ]);
}
function getObj(key: any): Op {
  return new Op("get", [ key ]);
}
function filter(key: any, value: any): Op {
  return new Op("filter", [ key, value ]);
}
function notFilter(key: any, value: any): Op {
  return new Op("notFilter", [ key, value ]);
}
function utils(utilMethod: string, param: any): Op {
  return new Op("utils", [utilMethod, param]);
}

function ifLogic(params: Op, results: { true: any, false: any }): IfLogic {
  return new IfLogic(params, results);
}

function loopLogic(instructions: any): LoopLogic {
  return new LoopLogic(undefined, undefined, instructions);
}

function loopArrayLogic(arrayParam: any, varname: string, instructions: any): LoopLogic {
  return new LoopLogic(arrayParam, varname, instructions);
}

function loopEnd(): Logic {
  return new Logic("end", undefined);
}

function execute(params: any, toExecute: Function): FunctionLogic {
  return new FunctionLogic(params, toExecute);
}

// not filter...

module.exports = {
  HullInstruction,
  Route,
  Svc,
  input,
  inputParameter,
  ifLogic,
  route,
  routeWithData,
  cond,
  hull,
  set,
  get,
  getObj,
  filter,
  notFilter,
  utils,
  loopLogic,
  loopArrayLogic,
  loopEnd,
  execute
};
