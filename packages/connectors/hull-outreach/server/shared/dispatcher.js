/* @flow */
import type {
  HullContext,
  HullAccountUpdateMessage,
  HullUserUpdateMessage,
  HullUserClaims,
  HullAccountClaims
} from "hull";

import type {
  ServiceTransforms
} from "./types";

const _ = require("lodash");
const {
  HullOutgoingUser,
  HullOutgoingAccount,
  HullIncomingUser,
  HullIncomingAccount
} = require("./hull-service-objects");

const {
  LogicError
} = require("hull/src/errors");

//TODO this is bad, must abstract this....
const {
  WebhookPayload
} = require("../service-objects");

const { HullInstruction, Route } = require("./language");

const { doVariableReplacement } = require("./variable-utils");
const { FrameworkUtils } = require("./framework-utils");
const { isUndefinedOrNull, ServiceData } = require("./utils");

const { ServiceEngine } = require("./service-engine");

import type { HullRequest } from "hull";

const debug = require("debug")("hull-shared:engine");

class HullDispatcher {

  services: ServiceEngine;
  glue: Object;
  ensure: string;
  ensurePromise: Promise<any>;

  // input transforms and services....
  // could have multiple services in the future... maybe take in an array?
  // really, we could run all of them in the same place potentially
  constructor(glue: Object, services: Object, transforms: ServiceTransforms, ensure: string) {
    this.glue = glue;
    this.services = new ServiceEngine(this, services, transforms);
    this.ensure = ensure;
  }

  async dispatch(context: Object, route: string) {
    return await this.handleRequest(context, route, null);
  }

  async dispatchWithData(context: Object, route: string, type: any, data: any) {
    return await this.handleRequest(context, route, new ServiceData(type, data));
  }

  async handleRequest(context: Object, route: string, data: null | ServiceData) {
    // try {
      if (!_.isEmpty(this.ensure)) {
        if (isUndefinedOrNull(this.ensurePromise)) {
          this.ensurePromise = this.resolve(_.assign({}, context), new Route(this.ensure), data);
          await this.ensurePromise;
        } else {
          await this.ensurePromise;
        }

      }
      // TODO probably should use message or ServiceData local context
      // so we don't have to do this weird assign at the top to create message
      // specific context
      return await this.resolve(_.assign({}, context), new Route(route), data);
    // } catch (error) {
    //   console.log("Error here: " + error.stack);
    // }
  }

  async resolve(context: Object, instruction: Object, serviceData: null | ServiceData): any {

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
        const result = await this.resolve(context, instruction[index], serviceData);
        results.push(result);
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

      const params = instruction.params;

      // Is this where we could detect if serviceData was an array
      // then resolve params one by one?
      let resolvedParams = await this.resolve(context, params, serviceData);

      if (!isUndefinedOrNull(resolvedParams)) {

        let paramName = null;
        if (params instanceof HullInstruction) {
          paramName = `${params.type}:${params.name}`;
        } else  if (typeof params === 'string') {
          paramName = params;
        }

        let paramString = JSON.stringify(resolvedParams);
        // if (paramString.length > 60) {
        //   paramString = `${paramString.substring(0,60)}...`;
        // }

        if (paramName === null) {
          debug(`[EXECUTING]: ${instruction.type}<${instruction.name}> [WITH-RESOLVED-PARAM]: ${paramString}`);
        } else {
          debug(`[EXECUTING]: ${instruction.type}<${instruction.name}> [FROM]: ${paramName} [WITH-RESOLVED-PARAM]: ${paramString}`);
        }

      } else {
        debug(`[EXECUTING]: ${instruction.type}<${instruction.name}>`);
      }

      return await this.interpretInstruction(context, instruction, resolvedParams, serviceData);
    } else {
      return doVariableReplacement(context, instruction);
    }
  }


  /**
   * There's an abtraction between serviceData (outgoing) and resolveParams(incoming) that needs to be clarified
   * It also provides a decent starting concept for joining data back together when doing things like batch operations...
   */
  async interpretInstruction(context: Object, instruction: Object, resolvedParams: any, serviceData: null | ServiceData) {
    let type = _.get(instruction, "type");

    if (type === 'reference') {

      const name = instruction.name;

      if (name === 'input') {
        if (serviceData !== null && !isUndefinedOrNull(instruction.path)) {
          const path = doVariableReplacement(context, instruction.path);
          return _.get(serviceData.data, path);
        }
        return serviceData;
      }

      throw new Error(`Unsupported Reference: ${name}`);

    } else if (type === 'route') {
      const route = this.glue[instruction.name];
      if (_.isEmpty(route)) {
        throw new Error(`Route: ${instruction.name} not found in glue`);
      }

      if (!isUndefinedOrNull(instruction.paramsType)) {
        // TODO could be a pattern for expansion on array to go in parallel
        return await this.resolve(context, route, new ServiceData(instruction.paramsType, resolvedParams));
      } else {
        return await this.resolve(context, route, serviceData);
      }

    } else if (type === 'logic') {

      const name = instruction.name;

      if (name === 'if') {

        // TODO if resolved params is an array, then we split servicedata here?
        // what if the resolve params need to become the service data or get mixed with the service data?
        // and enter into the glue loop?
        if (resolvedParams) {
          // Could drop a promise all around both of these and go parallel
          // down both paths...
          // But would introduce the complexity of having 2 paths where if we fail
          // on somthing like unauthorized, would have to vacate other superAgents
          // to stop refresh/retry logic being triggered 2x, or maybe introduce
          // some sort of retry mutex... (kinda already have one, maybe could serve this purpose too)
          return await this.resolve(context, instruction.results.true, serviceData);
        } else {
          return await this.resolve(context, instruction.results.false, serviceData);
        }

      } else if (name === 'loop') {
        if (!isUndefinedOrNull(resolvedParams)) {
          // make sure these aren't null because they weren't able to be resolved...

          if (!Array.isArray(resolvedParams)) {
            throw new Error("Don't know what this looping case is where the parameters aren't an array... not sure it should exist");
          }

          const results = [];
          for (let i = 0; i < resolvedParams.length; i++) {
            _.set(context, instruction.varname, resolvedParams[i]);
            const instructionResults = await this.resolve(context, instruction.instructions, serviceData);
            results.push(instructionResults);

            // check to see if includes an end, if so, then stop looping...
            const endInstruction = _.find(instructionResults, (instructionResult) => {
              if (instructionResult instanceof HullInstruction
                && instructionResult.name === "end") {
                  return true;
                }
              return false;
            });
            if (!isUndefinedOrNull(endInstruction)) {
              break;
            }
          }
          return results;

        } else {

          const results = [];
          while(true) {
            const instructionResults = await this.resolve(context, instruction.instructions, serviceData);
            results.push(instructionResults);
            // if results do not contain an end(), then continue to loop
            const endInstruction = _.find(instructionResults, (instructionResult) => {
              if (instructionResult instanceof HullInstruction
                && instructionResult.name === "end") {
                  return true;
                }
              return false;
            });
            if (!isUndefinedOrNull(endInstruction)) {
              break;
            }
          }
          return results;

        }

      } else if (name === 'end') {
        return instruction;
      } else if (name === 'function') {

        let obj = resolvedParams;
        if (resolvedParams instanceof ServiceData) {
          obj = obj.data;
        }
        return instruction.toExecute(obj);
      } else {
        throw new Error(`Unsupported Logic: ${name}`);
      }

    } else if (type === 'operation') {
      const name = instruction.name;

      // TODO gotta work out this bs logic to standardize...
      if (Array.isArray(resolvedParams)) {

        if (resolvedParams.length === 2) {

          // some operations would rather look at the data
          // I don't get it, it's just their preference
          let obj = resolvedParams[0];
          if (obj instanceof ServiceData) {
            obj = obj.data;
          }

          if (name === 'set') {

            //TODO any reason we don't want to use obj???
            _.set(context, resolvedParams[0], resolvedParams[1]);
            // return the obj that we set...
            return resolvedParams[1];
          } else if (name === 'get') {
            return _.get(obj, resolvedParams[1]);
          } else if (name === 'isEqual') {
            return _.isEqual(obj, resolvedParams[1]);
          } else if (name === 'filter') {
            return _.filter(obj, resolvedParams[1]);
          } else if (name === 'notFilter') {
            return _.filter(obj,
              (individualObj) => {
                return !_.isMatch(individualObj, resolvedParams[1])
              });
          } else if (name === 'utils') {
            return new FrameworkUtils()[resolvedParams[0]](context, resolvedParams[1]);
          } else if (name === "lessThan") {
            return obj < resolvedParams[1];
          } else {
            throw new Error(`Unsupported Conditional: ${name}`);
          }
        } else if (resolvedParams.length === 1) {
          if (name === 'get') {
            return _.get(context, resolvedParams[0]);
          }
        }
      }

      if (name === 'notEmpty') {
        return (typeof resolvedParams === 'number') || !_.isEmpty(resolvedParams);
      } else if (name === 'isEmpty') {
        return (typeof resolvedParams !== 'number') && _.isEmpty(resolvedParams);
      }

      throw new Error(`Operation ${name} contains invalid format with params: ${JSON.stringify(resolvedParams)}`);

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
