/* @flow */

class Route {
  type: string;

  name: string;

  constructor(name: string) {
    this.type = "route";
    this.name = name;
  }
}

class Cond {
  type: string;

  name: string;

  params: any;

  constructor(name: string, params: any) {
    this.type = "condition";
    this.name = name;
    this.params = params;
  }
}

class Svc {
  type: string;

  name: string;

  op: string;

  query: any;

  params: any;

  constructor(name: string, op: string, query: any, params: any) {
    this.type = "service";
    this.name = name;
    this.op = op;
    this.query = query;
    this.params = params;
  }
}

class Op {
  type: string;

  name: string;

  params: any;

  constructor(name: string, params: any) {
    this.type = "operation";
    this.name = name;
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
function updateSettings(key: any, value: any) {
  return new Op("updateSettings", [ key, value ]);
}
function filter(key: any, value: any) {
  return new Op("filter", [ key, value ]);
}

module.exports = {
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
  updateSettings
};
