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
const { isUndefinedOrNull, toSendMessage } = require("./utils");

const { ServiceEngine } = require("./service-engine");

import type { HullRequest } from "hull";

const debug = require("debug")("hull-shared:engine");

class ServiceData {
  classType: any;
  context: Object;
  data: any

  constructor(classType: any, data: any) {
    this.classType = classType;
    this.context = {};
    this.data = data;
  }
}

class HullConnectorEngine {

  services: ServiceEngine;
  glue: Object;
  ensure: string;

  // TODO input transforms and services....
  // TODO could have multiple services in the future... maybe take in an array?
  // TODO really, we could run all of them in the same place potentially
  constructor(glue: Object, services: Object, transforms: ServiceTransforms, ensure: string) {
    this.glue = glue;
    this.services = new ServiceEngine(this, services, transforms);
    this.ensure = ensure;
  }

  async dispatch(context: Object, instruction: Object) {
    return await this.dispatchWithData(context, instruction, null);
  }

  async dispatchWithData(context: Object, instruction: Object, data: null | ServiceData) {
    try {
      if (!_.isEmpty(this.ensure)) {
        await this.resolve(_.merge({}, context), new Route(this.ensure), data);
      }
      // TODO probably should use message or ServiceData local context
      // so we don't have to do this weird merge at the top to create message
      // specific context
      return await this.resolve(_.merge({}, context), instruction, data);
    } catch (error) {
      console.log("Error here: " + error.stack);
    }
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
        if (paramString.length > 60) {
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
          return _.get(serviceData.data, instruction.path);
        }
        return serviceData;
      }

      throw new Error(`Unsupported Reference: ${name}`);

    } else if (type === 'route') {
      const route = this.glue[instruction.name];
      if (_.isEmpty(route)) {
        throw new Error(`Route: ${instruction.name} not found in glue`);
      }
      return await this.resolve(context, route, serviceData);
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

      return await this.services.resolveInstruction(context, instruction, resolvedParams);

    } else {
      throw new Error("Unsupported type: " + type);
    }

  }

/******************* this one isn't declared in manifest *******************/
  getAuthCallback() {
    return this.services.getAuthCallback();
  }

/******************* this one isn't declared in manifest *******************/
  fetchAll(context: HullContext) {
    this.dispatch(context, new Route("fetchAll"));
    return Promise.resolve("ok");
  }

  /******************* this one isn't declared in manifest *******************/
  webhook(context: HullContext, webhookPayload: any) {
    // Interesting abstraction problem
    // need to tell what type of data is incoming, but the data incoming will be different per connector
    // so there's an idea that needs to be abstracted above
    this.dispatchWithData(context, new Route("webhook"), new ServiceData(WebhookPayload, webhookPayload.body));
    return Promise.resolve({ status: 200, text: "All good" });
  }

  status(req: HullRequest): Promise<any> {
    const { connector, client } = req;
    let status: string = "ok";

    //TODO do a bunch of templated stuff
    //but can also do standard stuff....
    const messages: Array<string> = [];
    return client.put(`${connector.id}/status`, { status, messages }).then(() => {
      return { status, messages };
    });
  }

  userUpdate(context: HullContext, messages: Array<HullUserUpdateMessage>): Promise<any> {
    const promise = Promise.all(messages.map(message => {

      const sendMessage = toSendMessage(context, "user", message,
        "connector.settings.synchronized_user_segments",
        "connector.settings.outgoing_user_attributes"
        )
      if (sendMessage) {
        return this.dispatchWithData(context, new Route("userUpdateStart"), new ServiceData(HullOutgoingUser, message.user));
      } else {
        return Promise.resolve();
      }
    }));
    return promise;
   }


  accountUpdate(context: HullContext, messages: Array<HullAccountUpdateMessage>): Promise<any>  {

    const promise = Promise.all(messages.map(message => {
      const sendMessage = toSendMessage(context, "account", message,
        "connector.settings.synchronized_account_segments",
        "connector.settings.outgoing_account_attributes"
      );
      if (sendMessage) {
        return this.dispatchWithData(context, new Route("accountUpdateStart"), new ServiceData(HullOutgoingAccount, message.account));
      } else {
        return Promise.resolve();
      }
    }));
     return promise;
  }

}

module.exports = {
  HullConnectorEngine,
  ServiceData
};
