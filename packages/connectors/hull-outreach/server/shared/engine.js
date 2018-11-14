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
  HullServiceUser,
  HullServiceAccount
} = require("./hull-service-objects");

const { oAuthHandler } = require("hull/src/handlers");
const { oauth2 } = require("./auth/oauth2");

const { HullInstruction, Route } = require("./language");

const { doVariableReplacement } = require("./variable-utils");
const { FrameworkUtils } = require("./framework-utils");

const { SuperagentApi } = require("./superagent-api");
const { HullSdk } = require("./hull-service");
const { TransformImpl } = require("./transform-impl");

import type { HullRequest } from "hull";

const debug = require("debug")("hull-shared:engine");


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
    if (!_.isEmpty(this.ensure)) {
      await this.resolve(context, new Route(this.ensure));
    }
    return await this.resolve(context, instruction);
  }

  async resolve(context: Object, instruction: Object): any {

    if (instruction === undefined || instruction === null) {
      return instruction;
    }

    if (Array.isArray(instruction)) {
      const results = [];

      for (let index = 0; index < instruction.length; index++) {
        const result = await this.resolve(context, instruction[index]);
        results.push(result);
      }

      return results;
    } else if (!_.isEmpty(instruction.if)) {
      // TODO maybe abstract the if concept, starting to seem out of place...
      const conditionResult = await this.resolve(context, instruction.if);
      if (conditionResult) {
        return await this.resolve(context, instruction.true);
      } else {
        return await this.resolve(context, instruction.false);
      }
    // } else if (!_.isEmpty(instruction.type)) {
    } else if (instruction instanceof HullInstruction) {
      const params = instruction.params;
      if (!_.isEmpty(_.get(params, "expires_in"))) {
        console.log('dying...');
      }
      let resolvedParams = await this.resolve(context, params);
      if (!_.isEmpty(resolvedParams)) {
        try {
          debug(`Got Parameters: ${JSON.stringify(resolvedParams)} for ${instruction.type}:${instruction.name}`);
        } catch (error) {
          debug("dead: "+ error);
        }
      }
      return await this.interpretInstruction(context, instruction, resolvedParams);
    } else {
      return doVariableReplacement(context, instruction);
    }
  }

  async interpretInstruction(context: Object, instruction: Object, resolvedParams: any) {
    let type = _.get(instruction, "type");

    debug(`Executing: ${instruction.type}:${instruction.name}`);

    if (type === 'route') {
      const route = this.glue[instruction.name];
      if (_.isEmpty(route)) {
        debug(`Route: ${instruction.name} not found in glue`);
        return null;
      }
      return await this.resolve(context, route);
    } else if (type === 'conditional') {
      const name = instruction.name;

      if (name === 'notEmpty') {
        return !_.isEmpty(resolvedParams);
      } else if (name === 'isEmpty') {
        return _.isEmpty(resolvedParams);
      } else {
        throw new Error(`Unsupported Conditional: ${name}`);
      }
    } else if (type === 'operation') {
      const name = instruction.name;

      if (Array.isArray(resolvedParams) && resolvedParams.length === 2) {

        if (name === 'set') {
          _.set(context, resolvedParams[0], resolvedParams[1]);
          return null;
        } else if (name === 'get') {
          return _.get(context, resolvedParams[0], resolvedParams[1]);
        } else if (name === 'filter') {
          return _.filter(resolvedParams[0], resolvedParams[1]);
        } else if (name === 'utils') {
          return new FrameworkUtils()[resolvedParams[0]](context, resolvedParams[1]);
        }

      }
    } else if (type === 'service') {

      let inputParams = resolvedParams;

      const isArrayInput = Array.isArray(inputParams)
      if (!isArrayInput) {
        inputParams = [inputParams];
      }

      // TODO may need to await calls 1 at a time...
      const results = [];

      for (let index = 0; index < inputParams.length; index++) {
        const result = await this.callService(context, instruction, inputParams[index]);
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

  async callService(context: Object, instruction: Object, inputParam: any) {

    const name = instruction.name;
    const op = instruction.op;

    const serviceDefinition = this.services[name];
    const endpoint = serviceDefinition.endpoints[op];

    let transformedObject;
    if (inputParam === undefined || inputParam === null || endpoint.input === undefined || endpoint.input === null) {
      transformedObject = inputParam;
    } else if (typeof inputParam === 'string') {
      transformedObject = this.transforms.transform(context, _.get(context, inputParam), endpoint.input, endpoint.output);
    } else {
      transformedObject = this.transforms.transform(context, inputParam, endpoint.input, endpoint.output);
    }

    debug(`Sending ${JSON.stringify(transformedObject)} to ${name}:${op}`);
    let retryablePromise;
    if (name === "hull") {
      retryablePromise = () =>{
        return new HullSdk(context, serviceDefinition).dispatch(op, transformedObject);
      }
    } else {
      retryablePromise = () =>{
        return new SuperagentApi(context, serviceDefinition, this).dispatch(op, transformedObject);
      }
    }
    return retryablePromise().catch(error => {
      debug(`Service ${name} Caught error: ${JSON.stringify(error)}`);
        const route: string = this.onErrorGetRecovery(serviceDefinition, error);
        if (!this.retryMutex && !_.isEmpty(route)) {
          this.retryMutex = true;
          debug(`Service ${name} attempting to recover with route: ${route}`);
          return this.resolve(context, new Route(route)).then(() => {
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
        if (_.matches(template.truthy)) {
          return true;
        }
        return false;
      });

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

    if (primaryService !== undefined) {
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
      this.dispatch(_.merge({}, context), new Route("fetchAll"));
      return Promise.resolve("ok");
    }
  }

  getWebhookCallback() {
    return (context: HullContext) => {
      this.dispatch(_.merge({}, context), new Route("webhook"));
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
          this.logger.info(SHARED_MESSAGES.OPERATION_SKIP_NOMATCHUSERSEGMENTS());
          return;
        }
      }

      // if no changes to account attributes
      //if ()
      return this.dispatch(_.merge({ user: message.user }, context), new Route("userUpdateStart"));
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
          this.logger.info(SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTS());
          return;
        }

        // if no changes to account attributes
        //if ()
      }

      return this.dispatch(_.merge({ account: message.account }, context), new Route("accountUpdateStart"));
    }));
    return promise;
  }
}

module.exports = {
  HullConnectorEngine
};
