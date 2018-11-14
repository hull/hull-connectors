/* @flow */

class HullInstruction {
  type: string;
  name: string;
  constructor(type: string, name: string) {
    this.type = type;
    this.name = name;
  }
}

class Route extends HullInstruction {
  constructor(name: string) {
    super("route", name);
  }
}

class Op extends HullInstruction {

  params: any;

  constructor(name: string, params: any) {
    super("operation", name);
    this.params = params;
  }
}

class Cond extends HullInstruction {

  params: any;

  constructor(name: string, params: any) {
    super("conditional", name);
    this.params = params;
  }
}

class Svc extends HullInstruction {
  op: string;

  query: any;

  params: any;

  constructor(name: string, op: string, query: any, params: any) {
    super("service", name);
    this.op = op;
    this.query = query;
    this.params = params;
  }
}

function route(name: string) {
  return new Route(name);
}
function cond(name: string, params: string | Object) {
  return new Cond(name, params);
}
function hull(op: string, params: string | Object) {
  return new Svc("hull", op, null, params);
}
function set(key: any, value: any) {
  return new Op("set", [ key, value ]);
}
function get(obj: any, key: any) {
  return new Op("get", [ obj, key ]);
}
function filter(key: any, value: any) {
  return new Op("filter", [ key, value ]);
}
function utils(utilMethod: string, param: any) {
  return new Op("utils", [utilMethod, param]);
}

module.exports = {
  HullInstruction,
  Route,
  Cond,
  Svc,
  Op,
  route,
  cond,
  hull,
  set,
  get,
  filter,
  utils
};
