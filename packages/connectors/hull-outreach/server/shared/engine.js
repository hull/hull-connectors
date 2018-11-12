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

const { Route } = require("./language");

const { doVariableReplacement } = require("./utils");
const { SuperagentApi } = require("./superagent-api");
const { HullSdk } = require("./hull-service");
const { TransformImpl } = require("./transform-impl");

import type { HullRequest } from "hull";


class HullConnectorEngine {

  services: Object;
  transforms: TransformImpl;
  glue: Object;

  // TODO input transforms and services....
  // TODO could have multiple services in the future... maybe take in an array?
  // TODO really, we could run all of them in the same place potentially
  constructor(glue: Object, services: Object, transforms: ServiceTransforms) {
    this.glue = glue;
    this.services = services;
    this.transforms = new TransformImpl(transforms);
  }

  async resolve(context: Object, instruction: Object): any {

    if (instruction === undefined || instruction === null) {
      return instruction;
    }

    if (typeof instruction === 'string') {
      return doVariableReplacement(context, instruction);
    } else if (Array.isArray(instruction)) {

      const results = instruction.map(async (oneInstruction) => {
        return await this.resolve(context, oneInstruction);
      });
      return results;
    }

    if (!_.isEmpty(instruction.if)) {
      const conditionResult = await this.resolve(context, instruction.if);
      if (conditionResult) {
        return await this.resolve(context, instruction.true);
      } else {
        return await this.resolve(context, instruction.false);
      }
    }

    const params = instruction.params;
    let resolvedParams = await this.resolve(context, params);

    const type = _.get(instruction, "type");
    if (type === 'conditional') {
      const name = instruction.name;

      if (name === 'notEmpty') {
        return !_.isEmpty(resolvedParams);
      } else if (name === 'isEmpty') {
        return _.isEmpty(resolvedParams);
      } else {
        console.log("Unsupported: " + name);
      }

    } else if (type === 'service') {
      const name = instruction.name;
      const op = instruction.op;

      const serviceDefinition = this.services[name];
      const endpoint = serviceDefinition.endpoints[op];
      let transformedObject;

      if (resolvedParams !== undefined && resolvedParams !== null) {

        let traverse = resolvedParams;

        const isArrayInput = Array.isArray(resolvedParams)
        if (!isArrayInput) {
          traverse = [resolvedParams];
        }

        const results = await Promise.all(traverse.map(async traversalObj => {
          if (typeof resolvedParams === 'string') {
            transformedObject = this.transforms.transform(context, _.get(context, traversalObj), endpoint.input, endpoint.output);
          } else {
            transformedObject = this.transforms.transform(context, traversalObj, endpoint.input, endpoint.output);
          }
          if (name === "hull") {
            return await new HullSdk(context, serviceDefinition).dispatch(op, transformedObject);
          } else {
            return await new SuperagentApi(context, serviceDefinition).dispatch(op, transformedObject);
          }
        }));

        if (isArrayInput) {
          return results;
        } else if (results.length === 1){
          return results[0];
        } else  if (results.length === 0) {
          return null;
        }

      } else {
        if (name === "hull") {
          return await new HullSdk(context, serviceDefinition).dispatch(op, resolvedParams);
        } else {
          return await new SuperagentApi(context, serviceDefinition).dispatch(op, resolvedParams);
        }
      }



    } else if (type === 'operation') {
      const name = instruction.name;

      if (Array.isArray(resolvedParams) && resolvedParams.length === 2) {

        if (name === 'set') {
          _.set(context, resolvedParams[0], resolvedParams[1]);
        } else if (name === 'get') {
          return _.set(context, resolvedParams[0], resolvedParams[1]);
        } else if (name === 'updateSettings') {
          await context.ctx.helpers.settingsUpdate(resolvedParams[0], resolvedParams[1]);
        } else if (name === 'filter') {
          return resolvedParams[0].filter(
            obj => obj[resolvedParams[1][0]] === resolvedParams[1][1]
          );
        }

      }
    } else if (type === 'route') {
      const name = instruction.name;
      return await this.resolve(context, this.glue[name]);
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
      this.resolve(_.merge({}, context), new Route("fetchAll"));
      return Promise.resolve("ok");
    }
  }

  getWebhookCallback() {
    return (context: HullContext) => {
      this.resolve(_.merge({}, context), new Route("webhook"));
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
      return this.resolve(_.merge({ user: message.user }, context), new Route("userUpdateStart"));
    }));

    return promise;
  }

 accountUpdate(ctx: HullContext, messages: Array<HullAccountUpdateMessage>): Promise<any>  {
    const promise = Promise.all(messages.map(message => {

      if (!ctx.isBatch) {
        const matchesUserSegments = _.intersection(
          message.account.segment_ids,
          ctx.connector.settings.synchronized_account_segments
        ).length >= 1;

        if (!matchesUserSegments) {
          this.logger.info(SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTS());
          return;
        }

        // if no changes to account attributes
        //if ()
      }

      return this.resolve(_.merge({ account: message.account }, context), "accountUpdateStart");
    }));
    return promise;
  }
}

module.exports = {
  HullConnectorEngine
};
