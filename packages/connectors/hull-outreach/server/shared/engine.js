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
  HullOutgoingAccount,
  HullIncomingUser,
  HullIncomingAccount
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

const HashMap = require('hashmap');

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

  services: Object;
  transforms: TransformImpl;
  glue: Object;
  ensure: string;

  // TODO input transforms and services....
  // TODO could have multiple services in the future... maybe take in an array?
  // TODO really, we could run all of them in the same place potentially
  constructor(glue: Object, services: Object, transforms: ServiceTransforms, ensure: string) {
    this.glue = glue;
    this.services = services;
    this.transforms = new TransformImpl(transforms);
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
      let resolvedParams = await this.resolve(context, params, serviceData);

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

      let inputParams = resolvedParams;

      const isArrayInput = Array.isArray(inputParams)
      if (!isArrayInput) {
        inputParams = [inputParams];
      }

      //This is the way to call 1 at a time, but may want to call may at a time
      // const results = [];
      // for (let index = 0; index < inputParams.length; index++) {
      //   const result = await this.callService(context, instruction, inputParams[index]);
      //   results.push(result);
      // }

      // This calls concurrently, could have a switch between the 2
      // TODO figure out the difference between this promise on the outside
      // and the Promise.all on the inside of callService
      // I think it's that this promise handles the case where we have many message that we're passing
      // and makes sure they are all concurrently sent
      // then the one on the inside handles the case where we got a bunch of messages in 1 serviceData object
      // like a fetch all and it splits them into different objects...
      // may want to change the behavior, if we see a batch endpoint, 1 serviceData object with an array
      // doesn't need to split, but sends the whole array at the same time if "batch" is set...
      const promiseResults = await Promise.all(inputParams.map(input => {
        return this.callService(context, instruction, input);
      }));

      // Need to flatten, in case a single call returns an array
      // otherwise will return an array inside of an array
      // in cases where multiple calls are made that return multiple arrays
      // I think this is probably the desired behavior that we make them all 1 array
      // I think this is ok, if it's just 1 object returned too?
      const results = _.flatten(promiseResults);

      // TODO mmm dupe code... should refactor...
      const serviceDefinition = this.services[instruction.name];
      const endpoint = serviceDefinition.endpoints[instruction.op];

      if (!_.isEmpty(results)) {
        let newData;

        if (results.length === 1) {
          newData = results[0];
        } else {
          newData = results;
        }

        if (!isUndefinedOrNull(endpoint.output)) {
          return new ServiceData(endpoint.output, newData);
        } else {
          return newData;
        }
      }

      return results;

    } else {
      throw new Error("Unsupported type: " + type);
    }

  }

  async callService(context: Object, instruction: Object, inputParam: any) {

    const name = instruction.name;
    const op = instruction.op;
    const serviceDefinition = this.services[name];
    const endpoint = serviceDefinition.endpoints[op];

    if (isUndefinedOrNull(endpoint))
      throw new Error(`Undefined endpoint: ${name}<${op}>`);

    const dataTransforms = new HashMap();
    const dataToSend = [];
    let entityTypeString = null;

    if (!isUndefinedOrNull(inputParam)) {

      let objectToTransform;
      let classType = null;

      if (typeof inputParam === 'string') {
        objectToTransform = _.get(context, inputParam);
      } else if (inputParam instanceof ServiceData) {
        objectToTransform = inputParam.data;
        classType = inputParam.classType;

        if (classType === HullOutgoingUser) {
          entityTypeString = "user";
        } else if (classType === HullOutgoingAccount || classType === HullIncomingAccount) {
          entityTypeString = "account";
        }

      } else {
        objectToTransform = inputParam;
      }

      if (!isUndefinedOrNull(endpoint.input)) {

        if (endpoint.input === HullIncomingUser) {
          entityTypeString = "user";
        } else if (endpoint.input === HullIncomingAccount) {
          entityTypeString = "account";
        }

        if (Array.isArray(objectToTransform)) {
          _.forEach(objectToTransform, obj => {
            const transformedObject = this.transforms.transform(context, obj, classType, endpoint.input)
            dataTransforms.set(transformedObject, obj);
            dataToSend.push(transformedObject);
          });
        } else {
          const transformedObject = this.transforms.transform(context, objectToTransform, classType, endpoint.input);
          dataTransforms.set(transformedObject, objectToTransform);
          dataToSend.push(transformedObject);
        }
      } else {
        dataToSend.push(objectToTransform);
      }
    }

    if (_.isEmpty(dataToSend)) {
      // even if we don't have data, we want to call the service at least 1x
      // probably just a query with no data to push...
      dataToSend.push(null);
    }

    // this is pretty dry, but butt ugly... function inception
    const retryablePromise = () => {

      const sendData = (data) => {
          if (!_.isEmpty(data)) {
            debug(`[CALLING-SERVICE]: ${name}<${op}> [WITH-DATA]: ${JSON.stringify(data)}`);
          } else {
            debug(`[CALLING-SERVICE]: ${name}<${op}>`);
          }

          let direction;
          let dispatchPromise;
          if (name === "hull") {
            direction = "incoming";
            dispatchPromise = new HullSdk(context, serviceDefinition).dispatch(op, data);
          } else {
            direction = "outgoing";
            dispatchPromise = new SuperagentApi(context, serviceDefinition).dispatch(op, data);
          }

          // This specialized function makes sure to ensure the right context for log i think
          // we can see the exact user we were trying to send and which data was sent
          const getContextSpecificLogger = () => {
            let logger = context.client.logger;
            if (!isUndefinedOrNull(inputParam)) {
              if (inputParam.classType === HullOutgoingUser) {
                const userObject = dataTransforms.get(data);
                if (!_.isEmpty(userObject)) {
                  logger = context.client.asUser(userObject).logger;
                }
              } else if (inputParam.classType === HullOutgoingAccount) {
                // if inputParam is an array, must get the right obj
                // in the array for this log...
                const accountObject = dataTransforms.get(data);
                if (!_.isEmpty(accountObject)) {
                  logger = context.client.asAccount(accountObject).logger;
                }
              }
            }
            return logger;
          };

          return dispatchPromise.then((results) => {

            //TODO also need to account for batch endpoints
            // where we should loge a message for each of the objects in the batch
            if (entityTypeString !== null) {
              getContextSpecificLogger().info(`${direction}.${entityTypeString}.success`, data);
              debug(`${direction}.${entityTypeString}.success`, data);
            }

            // this is just for logging, do not suppress error here
            // pass it along with promise resolve
            return Promise.resolve(results);
          }).catch (error => {

            if (entityTypeString !== null) {
              getContextSpecificLogger().error(`${direction}.${entityTypeString}.error`, data);
              debug(`${direction}.${entityTypeString}.error`, data);
            }

            // this is just for logging, do not suppress error here
            // pass it along with promise reject
            return Promise.reject(error);
          });
        }

      // if it's a batch endpoint, don't break apart...
      // just send whole array...
      if (endpoint.batch) {
        return sendData(dataToSend);
      } else {
        return Promise.all(dataToSend.map(sendData));
      }
    };

    // If executing concurrently, only one of these will succeed, the rest will fail
    // failing the whole message... but at least one gets through?
    return retryablePromise().catch(error => {

      debug(`[SERVICE-ERROR]: ${name} [ERROR]: ${JSON.stringify(error)}`);

      const retrying = _.get(context, "retrying");
      const errorTemplate = this.findErrorTemplate(context, serviceDefinition, error);

      const onUnrecoverable = () => {
        const errorException = this.createErrorException(context, name, serviceDefinition.error, errorTemplate, error);
        _.set(context, "retrying", false);
        return Promise.reject(errorException);
      };

      if (!isUndefinedOrNull(errorTemplate) && (isUndefinedOrNull(retrying) || !retrying)) {
        const route: string = _.get(errorTemplate, "recoveryroute");

        if (!_.isEmpty(route)) {
          _.set(context, "retrying", true);
          debug(`[SERVICE-ERROR]: ${name} [RECOVERY-ROUTE-ATTEMPT]: ${route}`);

          //don't input data on an attempt to recover...
          return this.resolve(context, new Route(route), null).then(() => {

            _.set(context, "retrying", false);
            return retryablePromise();

          }).catch(error => {
            return onUnrecoverable();
          });
        }
      }

      return onUnrecoverable();

    });
  }

  createErrorException(context: Object, servicename: string, errorDefinitions: Object, errorTemplate: any, error: any) {

    let logger = context.client.logger;

    if (isUndefinedOrNull(error)) {
      const message: string = `Unknown error while connecting with the ${servicename} API`;
      logger.error(message);
      return new Error(message);
    } else if (isUndefinedOrNull(errorDefinitions)) {
      const message: string = `Untemplated error while connecting with the ${servicename} API`;
      logger.error(message, error);
      return new Error(error);
    }

    const output = this.parseError(error, errorDefinitions.parser, {});
    const logMessage = this.createLogFromOutput(servicename, output);

    if (isUndefinedOrNull(errorTemplate)) {
      debug.error(logMessage, error);
      return new Error(error);
    } else {
      logger.error(errorTemplate.message().message, logMessage);
      return new errorTemplate.errorType(logMessage);
    }

  }

  createLogFromOutput(servicename: string, output: Object) {
    const {
      httpStatus,
      appStatusCode,
      title,
      description,
      source
    } = output;

    let log = `HTTP[${httpStatus}] ${servicename}[${appStatusCode}] ${title}`;

    if (!_.isEmpty(description)) log += `: ${description}`;
    if (!_.isEmpty(source)) log += ` SOURCE[${JSON.stringify(source)}]`;

    return log;

  }

  parseError(error: any, parser: any, output: Object): Object {

    if (isUndefinedOrNull(parser))
      return output;

    let target = error;

    if (!isUndefinedOrNull(parser.target)) {
      target = _.get(error, parser.target);
      if (!isUndefinedOrNull(parser.type)) {
        if (parser.type === 'json') {
          target = JSON.parse(target);
        }
      }
    }

    if (isUndefinedOrNull(target))
      return output;

    // ugh... shouldn't there be a lodash fuction for this????
    // I don't know cuz I'm a lodash newb...
    const httpStatus: any = _.get(target, parser.httpStatus);
    if (!isUndefinedOrNull(httpStatus)) _.set(output, "httpStatus", httpStatus);
    const appStatusCode: any = _.get(target, parser.appStatusCode);
    if (!isUndefinedOrNull(appStatusCode)) _.set(output, "appStatusCode", appStatusCode);
    const title: any = _.get(target, parser.title);
    if (!isUndefinedOrNull(title)) _.set(output, "title", title);
    const description: any = _.get(target, parser.description);
    if (!isUndefinedOrNull(description)) _.set(output, "description", description);
    const source: any = _.get(target, parser.source);
    if (!isUndefinedOrNull(source)) _.set(output, "source", source);

    // see if any sub parsers that we need
    // maybe make this a list instead of a nested obj?
    return this.parseError(target, parser.parser, output);
  }

  findErrorTemplate(context: Object, serviceDefinition: any, error: any) {
    if (!_.isEmpty(serviceDefinition.error.templates)) {

      return _.find(serviceDefinition.error.templates, template => {
        if (!isUndefinedOrNull(template.truthy)) {
          if (!_.isMatch(error, template.truthy)){
            return false;
          }
        }
        if (!isUndefinedOrNull(template.condition)) {
          if (!template.condition(context, error)) {
            return false;
          }
        }
        return true;
      });
    }
    return null;
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
      this.dispatchWithData(context, new Route("webhook"), new ServiceData(WebhookPayload, webhookPayload.body));
        return Promise.resolve({ status: 200, text: "All good" });
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
           context.client.asUser(message.user).logger.info("outgoing.user.skip", "User not in any user defined segments to send");
           return Promise.resolve();
         }
       }

       // if no changes to account attributes
       //if ()
       return this.dispatchWithData(context, new Route("userUpdateStart"), new ServiceData(HullOutgoingUser, message.user));
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
           context.client.asAccount(message.account).logger.info("outgoing.account.skip", "Account not in any user defined segments to send");
           return Promise.resolve();
         }

         // if no changes to account attributes
         //if ()
       }

       return this.dispatchWithData(context, new Route("accountUpdateStart"), new ServiceData(HullOutgoingAccount, message.account));
     }));
     return promise;
  }

}

module.exports = {
  HullConnectorEngine
};
