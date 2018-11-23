/* @flow */
import type {
  HullContext,
  HullAccountUpdateMessage,
  HullUserUpdateMessage
} from "hull";

import type {
  ServiceTransforms
} from "./types";

const _ = require("lodash");
const {
  HullOutgoingUser,
  HullOutgoingAccount
} = require("./hull-service-objects");

//TODO this is bad, must abstract this....
const {
  WebhookPayload
} = require("../service-objects");

const { oAuthHandler } = require("hull/src/handlers");
const { oauth2 } = require("./auth/oauth2");

const { HullInstruction, Route } = require("./language");

const { doVariableReplacement } = require("./variable-utils");
const { FrameworkUtils } = require("./framework-utils");
const { isUndefinedOrNull } = require("./utils");

const { SuperagentApi } = require("./superagent-api");
const { HullSdk } = require("./hull-service");
const { TransformImpl } = require("./transform-impl");

import type { HullRequest } from "hull";

const debug = require("debug")("hull-shared:engine");

class IncomingData {
  classType: any;
  obj: any
  constructor(classType: any, obj: any) {
    this.classType = classType;
    this.obj = obj;
  }
}


class HullConnectorEngine {

  services: Object;
  transforms: TransformImpl;
  glue: Object;
  ensure: string;
  retryMutex: boolean;

  // TODO input transforms and services....
  // TODO could have multiple services in the future... maybe take in an array?
  // TODO really, we could run all of them in the same place potentially
  constructor(glue: Object, services: Object, transforms: ServiceTransforms, ensure: string) {
    this.glue = glue;
    this.services = services;
    this.transforms = new TransformImpl(transforms);
    this.ensure = ensure;
    this.retryMutex = false;
  }

  async dispatch(context: Object, instruction: Object) {
    return await this.dispatchWithData(context, instruction, null);
  }

  async dispatchWithData(context: Object, instruction: Object, data: null | IncomingData) {
    try {
      if (!_.isEmpty(this.ensure)) {
        await this.resolve(0, context, new Route(this.ensure), data);
      }
      return await this.resolve(0, context, instruction, data);
    } catch (error) {
      console.log("Error here: " + error.stack);
    }
  }

  async resolve(depth: number, context: Object, instruction: Object, data: null | IncomingData): any {

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
        const result = await this.resolve(depth, context, instruction[index], data);
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
      let resolvedParams = await this.resolve(depth, context, params, data);

      if (!isUndefinedOrNull(resolvedParams)) {

        let paramName = null;
        if (params instanceof HullInstruction) {
          paramName = `${params.type}:${params.name}`;
        } else  if (typeof params === 'string') {
          paramName = params;
        }

        let paramString = JSON.stringify(resolvedParams);
        if (paramString.length > 30) {
          paramString = `${paramString.substring(0,60)}...`;
        }

        if (paramName === null) {
          debug(`[EXECUTING]: ${instruction.type}<${instruction.name}> [RESOLVED-TO]: ${paramString}`);
        } else {
          debug(`[EXECUTING]: ${instruction.type}<${instruction.name}> [FROM]: ${paramName} [RESOLVED-TO]: ${paramString}`);
        }

      } else {
        debug(`[EXECUTING]: ${instruction.type}<${instruction.name}>`);
      }

      return await this.interpretInstruction(depth, context, instruction, resolvedParams, data);
    } else {
      return doVariableReplacement(context, instruction);
    }
  }

  async interpretInstruction(depth: number, context: Object, instruction: Object, resolvedParams: any, data: null | IncomingData) {
    let type = _.get(instruction, "type");

    if (type === 'reference') {

      const name = instruction.name;

      if (name === 'input') {
        if (data !== null && !isUndefinedOrNull(instruction.path)) {
          return _.get(data.obj, instruction.path);
        }
        return data;
      }

      throw new Error(`Unsupported Reference: ${name}`);

    } else if (type === 'route') {
      const route = this.glue[instruction.name];
      if (_.isEmpty(route)) {
        throw new Error(`Route: ${instruction.name} not found in glue`);
      }
      return await this.resolve(depth, context, route, data);
    } else if (type === 'logic') {

      const name = instruction.name;

      if (name === 'if') {

        if (resolvedParams) {
          return await this.resolve(depth, context, instruction.results.true, data);
        } else {
          return await this.resolve(depth, context, instruction.results.false, data);
        }

      } else {
        throw new Error(`Unsupported Logic: ${name}`);
      }

    } else if (type === 'operation') {
      const name = instruction.name;

      // gotta work out this bs logic to standardize...
      if (Array.isArray(resolvedParams)) {

        if (resolvedParams.length === 2){

          if (name === 'set') {
            _.set(context, resolvedParams[0], resolvedParams[1]);
            // return the obj that we set...
            return resolvedParams[1];
          } else if (name === 'get') {
            return _.get(resolvedParams[0], resolvedParams[1]);
          } else if (name === 'isEqual') {
            return _.isEqual(resolvedParams[0], resolvedParams[1]);
          } else if (name === 'filter') {
            return _.filter(resolvedParams[0], resolvedParams[1]);
          } else if (name === 'utils') {
            return new FrameworkUtils()[resolvedParams[0]](context, resolvedParams[1]);
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

      //TODO need to decide if this is valid....
      return null;
    } else if (type === 'service') {

      let inputParams = resolvedParams;

      const isArrayInput = Array.isArray(inputParams)
      if (!isArrayInput) {
        inputParams = [inputParams];
      }

      // TODO may need to await calls 1 at a time...
      const results = [];

      for (let index = 0; index < inputParams.length; index++) {
        const result = await this.callService(depth, context, instruction, inputParams[index]);
        results.push(result);
      }

      if (isArrayInput) {
        return results;
      } else if (results.length === 1){
        return results[0];
      } else  if (results.length === 0) {
        return null;
      }

    } else {
      throw new Error("Unsupported type: " + type);
    }

  }

  async callService(depth: number, context: Object, instruction: Object, inputParam: any) {

    const name = instruction.name;
    const op = instruction.op;
    const serviceDefinition = this.services[name];
    const endpoint = serviceDefinition.endpoints[op];

    if (isUndefinedOrNull(endpoint))
      throw new Error(`Undefined endpoint: ${name}<${op}>`);

    let transformedObject = inputParam;

    if (!isUndefinedOrNull(inputParam)) {
      let classType = null;

      if (typeof inputParam === 'string') {
        transformedObject = _.get(context, inputParam);
      } else if (inputParam instanceof IncomingData) {
        transformedObject = inputParam.obj;
        classType = inputParam.classType;
      }

      if (!isUndefinedOrNull(endpoint.input)) {
        transformedObject = this.transforms.transform(context, transformedObject, classType, endpoint.input);
      }
    }

    if (!_.isEmpty(transformedObject)) {
      debug(`[CALLING-SERVICE]: ${name}<${op}> [WITH-DATA]: ${JSON.stringify(transformedObject)}`);
    } else {
      debug(`[CALLING-SERVICE]: ${name}<${op}>`);
    }

    let retryablePromise;
    if (name === "hull") {
      retryablePromise = () =>{
        return new HullSdk(context, serviceDefinition).dispatch(op, transformedObject);
      }
    } else {
      retryablePromise = () =>{
        // TODO fix error throwing... it's throwing out to nowhere...
        // console.log(JSON.stringify(context));
        return new SuperagentApi(context, serviceDefinition).dispatch(op, transformedObject);
      }
    }

    return retryablePromise().catch(error => {
      debug(`[SERVICE-ERROR]: ${name} [ERROR]: ${JSON.stringify(error)}`);
        const route: string = this.onErrorGetRecovery(serviceDefinition, error);
        if (!this.retryMutex && !_.isEmpty(route)) {
          this.retryMutex = true;
          debug(`[SERVICE-ERROR]: ${name} [RECOVERY-ROUTE-ATTEMPT]: ${route}`);
          return this.resolve(depth, context, new Route(route), inputParam).then(() => {
            this.retryMutex = false;
            return retryablePromise();
          }).catch(error => {
            this.retryMutex = false;
            return Promise.reject(error);
          });
      } else {
        return Promise.reject(error);
      }
    });
  }

  onErrorGetRecovery(serviceDefinition: any, error: any): any {
    if (!_.isEmpty(serviceDefinition.retry.templates)) {
      const matchingTemplate = _.find(serviceDefinition.retry.templates, template => {
        if (_.isMatch(error, template.truthy)) {
          return true;
        }
        return false;
      });

      // checking undefined here even though is empty does it
      // to make flow happy
      if (matchingTemplate !== undefined && !_.isEmpty(matchingTemplate)) {
        return matchingTemplate.route;
      }
    }
    return null;
  }

  getAuthCallback() {
    const primaryService = _.find(this.services, (service) => {
        return !_.isEmpty(service.authentication)
      });

    if (!isUndefinedOrNull(primaryService)) {
      const authentication = primaryService.authentication;

      if (authentication.strategy === "oauth2") {
        const params = _.cloneDeep(authentication.params);
        _.merge(params, oauth2);
        return oAuthHandler(params);
      }
    }
    return null;
  }

  getStatusCallback(): (req: HullRequest) => Promise<any> {
    return (req: HullRequest) => {
      const { connector, client } = req;
      let status: string = "ok";

      //TODO do a bunch of templated stuff
      //but can also do standard stuff....
      const messages: Array<string> = [];
      return client.put(`${connector.id}/status`, { status, messages }).then(() => {
        return { status, messages };
      });
    }
  }

  getFetchAllAction() {
    return (context: HullContext) => {
      this.dispatch(context, new Route("fetchAll"));
      return Promise.resolve("ok");
    }
  }

  getWebhookCallback() {
    return (context: HullContext, webhookPayload: any) => {
      // Interesting abstraction problem
      // need to tell what type of data is incoming, but the data incoming will be different per connector
      // so there's an idea that needs to be abstracted above
      this.dispatchWithData(context, new Route("webhook"), new IncomingData(WebhookPayload, webhookPayload.body));
      return Promise.resolve("ok");
    }
  }

 userUpdate(context: HullContext, messages: Array<HullUserUpdateMessage>): Promise<any> {
    // TODO filtering logic first
    // segment filters
    // no attribute mapping filters
    const promise = Promise.all(messages.map(message => {

      if (!context.isBatch) {
        const matchesUserSegments = _.intersection(
          message.user.segment_ids,
          context.connector.settings.synchronized_user_segments
        ).length >= 1;

        if (!matchesUserSegments) {
          debug(`User does not match segment ${ JSON.stringify(message.user) }`);
          return;
        }
      }

      // if no changes to account attributes
      //if ()
      return this.dispatchWithData(context, new Route("userUpdateStart"), new IncomingData(HullOutgoingUser, message.user));
    }));

    return promise;
  }

 accountUpdate(context: HullContext, messages: Array<HullAccountUpdateMessage>): Promise<any>  {
    const promise = Promise.all(messages.map(message => {

      if (!context.isBatch) {
        const matchesUserSegments = _.intersection(
          message.account.segment_ids,
          context.connector.settings.synchronized_account_segments
        ).length >= 1;

        if (!matchesUserSegments) {
          debug(`Account does not match segment ${ JSON.stringify(message.account) }`);
          return;
        }

        // if no changes to account attributes
        //if ()
      }

      return this.dispatchWithData(context, new Route("accountUpdateStart"), new IncomingData(HullOutgoingAccount, message.account));
    }));
    return promise;
  }
}

module.exports = {
  HullConnectorEngine
};
