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

const { oAuthHandler } = require("hull/src/handlers");
const { oauth2 } = require("./auth/oauth2");

const { HullInstruction, Route } = require("./language");

const { doVariableReplacement } = require("./variable-utils");
const { FrameworkUtils } = require("./framework-utils");
const { isUndefinedOrNull } = require("./utils");

const { HullSdk } = require("./hull-service");
const { SuperagentApi } = require("./superagent-api");
const { TransformImpl } = require("./transform-impl");
const { HullConnectorEngine, ServiceData } = require("./engine");

const HashMap = require('hashmap');


const debug = require("debug")("hull-shared:service-engine");

class ServiceEngine {

  engine: HullConnectorEngine;
  services: Object;
  transforms: TransformImpl;
  engineContext: Object;

  constructor(engine: HullConnectorEngine, services: Object, transforms: ServiceTransforms) {
    this.engine = engine;
    this.services = services;
    this.transforms = new TransformImpl(transforms);
    this.engineContext = {};
  }


  async resolveInstruction(context: Object, instruction: Object, param: any) {

    let inputParams = param;

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

    const direction = (name === "hull") ? "incoming" : "outgoing";

    // this is pretty dry, but butt ugly... function inception
    const sendData = (data) => {
      if (!_.isEmpty(data)) {
        debug(`[CALLING-SERVICE]: ${name}<${op}> [WITH-DATA]: ${JSON.stringify(data)}`);
      } else {
        debug(`[CALLING-SERVICE]: ${name}<${op}>`);
      }

      let dispatchPromise;
      if (name === "hull") {
        dispatchPromise = new HullSdk(context, serviceDefinition).dispatch(op, data);
      } else {
        dispatchPromise = new SuperagentApi(context, serviceDefinition).dispatch(op, data);
      }

      return dispatchPromise.catch(error => {

        debug(`[SERVICE-ERROR]: ${name} [ERROR]: ${JSON.stringify(error)}`);

        const errorTemplate = this.findErrorTemplate(context, serviceDefinition, error);
        const errorException = this.createErrorException(context, name, serviceDefinition.error, errorTemplate, error);

        if (!isUndefinedOrNull(errorTemplate)) {
          const route: string = _.get(errorTemplate, "recoveryroute");

          if (!_.isEmpty(route) && !_.isEqual(route, _.get(context, "recoveryroute"))) {

            let recoveryPromise = _.get(this.engineContext, `${name}.${route}`);

            // 2 cases,
            // where the recovery promise exists and it's a different path calling
            // and where it IS the recovery path....
            if (isUndefinedOrNull(recoveryPromise)) {
              debug(`[SERVICE-ERROR]: ${name} [RECOVERY-ROUTE-ATTEMPT]: ${route}`);
              // The way we do this _.merge is key, means, only the recoveryroute
              // will have it set, but others will not
              recoveryPromise = this.engine.resolve(_.merge({ recoveryroute: route }, context), new Route(route), null)
              _.set(this.engineContext, `${name}.${route}`, recoveryPromise);
            }
            //don't input data on an attempt to recover...
            return recoveryPromise.then(() => {
              return sendData(data);
            }).catch( error => {
              return Promise.reject(errorException);
            });
          }
        }
        return Promise.reject(errorException);

      });
    }

    const logDataWrapperAroundSendData = (data) => {

      // This specialized function makes sure to ensure the right context for log i think
      // we can see the exact user we were trying to send and which data was sent
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

      return sendData(data).then((results) => {
        //TODO also need to account for batch endpoints
        // where we should loge a message for each of the objects in the batch
        if (entityTypeString !== null) {
          logger.info(`${direction}.${entityTypeString}.success`, data);
          debug(`${direction}.${entityTypeString}.success`, data);
        }
        // this is just for logging, do not suppress error here
        // pass it along with promise resolve
        return Promise.resolve(results);
      }).catch (error => {

        if (entityTypeString !== null) {
          logger.error(`${direction}.${entityTypeString}.error`, data );
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
      return logDataWrapperAroundSendData(dataToSend);
    } else {
      return Promise.all(dataToSend.map(logDataWrapperAroundSendData));
    }

    // If executing concurrently we know have engine scope, so others know the recovery
    // route is pending, or we're in the recovery route
    // This works with submitting the messages one at a time with the same service engine
    // won't work as well if submitting messages for a batch endpoint
  }

  createErrorException(context: Object, servicename: string, errorDefinitions: Object, errorTemplate: any, error: any) {

    let logger = context.client.logger;

    if (isUndefinedOrNull(error)) {
      const message: string = `Unknown error while connecting with the ${servicename} API`;
      logger.error(message);
      // throw new error if an error obj does not exist, not sure what the case for this is...
      return new Error(message);
    } else if (isUndefinedOrNull(errorDefinitions)) {
      const message: string = `Untemplated error while connecting with the ${servicename} API`;
      logger.error(message, error);
      // if there is no errordefinition, then no way to parse anything out, just throw the original error
      return error;
    }

    const output = this.parseError(error, errorDefinitions.parser, {});
    const logMessage = this.createLogFromOutput(servicename, output);

    if (isUndefinedOrNull(errorTemplate)) {
      debug(JSON.stringify(output), error);
      // may have parsed parameters from the parser, but no specific error condition with message
      // probably want to both return what was parsed, but also the original error somehow
      // if we can't specifically handle it, even though we got the parameters...
      // unlikely that we got a good log output here... stringify the output
      // probably empty...
      return error;

    } else {
      logger.error(errorTemplate.message().message, logMessage);
      return new errorTemplate.errorType(logMessage, error);
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
      if (!isUndefinedOrNull(target) && !isUndefinedOrNull(parser.type)) {
        if (parser.type === 'json') {
          if (typeof target === 'string') {
            target = JSON.parse(target);
          }
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
}

module.exports = {
  ServiceEngine
};
