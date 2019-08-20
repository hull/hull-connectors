/* @flow */

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
  LogicError,
  SkippableError
} = require("hull/src/errors");

const HullVariableContext = require("./variable-context");

const { Route } = require("./language");

const {
  isUndefinedOrNull,
  parseIntOrDefault,
  setHullDataType,
  getHullDataType,
  getHullPlatformTypeName,
  sameHullDataType
} = require("./utils");

const { TransformImpl } = require("./transform-impl");
const { HullDispatcher } = require("./dispatcher");
const { streamCsv } = require("./service-engine-utils");


const debug = require("debug")("hull-shared:service-engine");

class ServiceEngine {

  dispatcher: HullDispatcher;
  services: Object;
  transforms: TransformImpl;

  // If executing concurrently we know have engine scope, so others know the recovery
  // route is pending, or we're in the recovery route
  // This works with submitting the messages one at a time with the same service engine
  // won't work as well if submitting messages for a batch endpoint
  recoveryPromise: Promise<any> | null;
  clearRecoveryPromiseHandle: any;

  constructor(dispatcher: HullDispatcher, services: Object, transforms: ServiceTransforms) {
    this.dispatcher = dispatcher;
    this.services = services;
    this.transforms = new TransformImpl(transforms);
  }

  close() {
    if (!isUndefinedOrNull(this.clearRecoveryPromiseHandle)) {
      clearTimeout(this.clearRecoveryPromiseHandle);
    }
  }


  async resolveInstruction(context: HullVariableContext, instruction: Object, param: any) {

    let inputParamsDataType = getHullDataType(param);
    // seems like a confusion bomb waiting to happen... so taking out for now
    // const isArrayInput = Array.isArray(inputParams)
    // if (isArrayInput) {
    //   inputParams = inputParams[0];
    // }


    //TODO maybe check the inputParams.classType for these type of variables
    // not necessarily the endpoint? though this isn't the endpoint
    // the class itself could contain all of the potential processing info
    // for that class, including validation...
    if (inputParamsDataType && inputParamsDataType.stream === 'csv') {
      return streamCsv(context, instruction, param);
    }

    return this.getResults(context, instruction, param);
  }

  async getResults(context: HullVariableContext, instruction: Object, param: any) {

    const instructionOptions = instruction.options;
    const name = instructionOptions.name;
    const op = instructionOptions.op;
    const serviceDefinition = this.services[name];

    if (isUndefinedOrNull(serviceDefinition))
      throw new Error(`Undefined ServiceDefinition: ${name}<${op}>`);


    // Endpoint may not exist
    // in cases where the endpoint may not add any value
    // we shouldn't make the user declare it
    // endpoint is to only be used to add additional metadata to the call
    let endpoint = _.get(serviceDefinition, `endpoints.${op}`);

    if (isUndefinedOrNull(endpoint)) {
      // we don't have an endpoint, but we don't want to break the code below
      // so we infer the endpoint values
      // batch: true -> Not sure if this is the right default
      // -> no, means that if we have a single value, it will be sent in an array
      // but also means if we have an array, it will send the whole array through
      // basically means "send as whole array"
      // but means we'll pass the data straight through to the service
      // and make the endpoint.input be the classType of the incoming data
      endpoint = { batch: true };
      endpoint.input = getHullDataType(param);
    }

    // The logic below pulls out the data and class type if the input is a service data
    let rawInputParam = param;
    let rawInputType = getHullDataType(param);

    // The logic below checks if the input parameters are an array, and makes sure this endpoint isn't a batch endpoint
    // if it is a batch endpoint, pass the arguements all together
    // if not, attempt to break up the array and send one at a time, which generally is the right behavior I guess
    // basically, if the input (underneath the servicedata or not) is an array, try to send the objects one at a time
    // otherwise, need to mark the endpoint as "batch" so that we send them all together
    // don't think we need too much more complicated than that
    // potentially use some "fan out" logic later to handle messages one at a time
    // ultimately fan back in may result in an array of service datas which may be an issue with this logic
    // but in which case the full array gets passed to transform, log and send, which will need to fan back in...
    // will handle it in the transform, I think, if we need that
    // might also need to special case endpoints where we're sending an array for an individual objects, might have to mark as batch...
    // but not sure that case necessarily exists...
    let results;
    if (!isUndefinedOrNull(rawInputParam) && !endpoint.batch && Array.isArray(rawInputParam)) {
      results = await Promise.all(rawInputParam.map( rawObject => {

        // not sure how we differentiate between the type at the array level and the
        setHullDataType(rawObject, rawInputType);
        return this.transformAndLogAndSendData(context, instruction, rawObject, endpoint);

      }));
    } else {
      results = await this.transformAndLogAndSendData(context, instruction, param, endpoint);
    }

    if (!_.isEmpty(results)) {

      let newData = results;

      //TODO this isn't necessarily the right thing...
      // I don't like having an endpoint which may or may not return an array
      // Commenting out... this seems like a confusion bomb waiting to happen
      // if (results.length === 1) {
      //   newData = results[0];
      // } else {
      //   newData = results;
      // }

      if (endpoint) {
        if (endpoint.streamType) {
          newData = newData.stream;
        } else if (!_.isEmpty(endpoint.returnObj)) {
          newData = _.get(newData, endpoint.returnObj);
        } else if (!_.isEmpty(serviceDefinition.defaultReturnObj)) {
          newData = _.get(newData, serviceDefinition.defaultReturnObj);
        }
        setHullDataType(newData, endpoint.output);

        if (endpoint.transformTo) {
          newData = this.transforms.transform(context, newData, endpoint.transformTo)
        }
      }

      return newData;

    }

    return results;
  }


  transformAndLogAndSendData(context: HullVariableContext, instruction: Object, inputParam: any, endpoint: any) {
    let dataToSend = inputParam;

    // Difference between batch or one at a time sent to the service
    // if we want it sent as batch, we put the type at the top level
    // if we want them sent one at a time, we put the type at the message level
    // though, not quite sure how we control that...
    // maybe at the glue level...
    if (!isUndefinedOrNull(dataToSend) && !isUndefinedOrNull(endpoint.input)) {
      dataToSend = this.transforms.transform(context, dataToSend, endpoint.input);
    }

    // if is an incoming data to hull, then log the final result sent to hull
    // otherwise if outgoing, log the hull data before all the transforms to the service
    // No, I think it makes more sense to show the data as it appears coming/going to the service
    // that's the hardest part to track anyway...
    // so incoming should be inputparam, outgoing, should be dataToSend
    const direction = (instruction.options.name === "hull") ? "incoming" : "outgoing";
    // But also need the right hull data types so that we can attach to the right hull entity and log the right thing..

    let hullEntityToLog;
    let dataToLog;
    let action;

    if (direction === "incoming") {
      // in the case of incoming data, then log the raw data which came from the service
      // more useful we think than the the data after it's been transformed to hull format, which we can view in firehose anyway
      dataToLog = inputParam;
      hullEntityToLog = dataToSend

      // in the case of incoming data, we need to log the name of the type which is being sent to hull (dataToSend)
      const hullTypeToLog = getHullPlatformTypeName(getHullDataType(dataToSend));
      action = `${direction}.${_.toLower(hullTypeToLog)}`;
    } else {
      // in the case of out going data, log the data being sent to the service
      // more useful than the kraken payload, which we can view in hull
      dataToLog = dataToSend;
      hullEntityToLog = inputParam;

      // In the case of outgoing data, we need to log the name of the hull type being sent
      const hullTypeToLog = getHullPlatformTypeName(getHullDataType(inputParam));
      action = `${direction}.${_.toLower(hullTypeToLog)}`;
    }

    return this.sendData(context, instruction, dataToSend).then((results) => {
      const systemMessage = `${action}.success`;

      // need a catch to suppress logs if we're handling logs in the endpoint itself (eg: explicit skips)
      if (endpoint.suppressLog !== true) {
        this.logMessage(context, instruction, endpoint, systemMessage, direction, { dataToLog, hullEntityToLog, results } );
      }

      // this is just for logging, do not suppress error here
      // pass it along with promise resolve
      return Promise.resolve(results);

    }).catch(error => {
      const entityStatus = error instanceof SkippableError ? "skip" : "error";
      const systemMessage = `${action}.${entityStatus}`;
      this.logMessage(context, instruction, endpoint, systemMessage, direction, { dataToLog, hullEntityToLog }, error);

      // if the issue was not an error, resolve, in cases where we marked it as a skippable error
      return entityStatus === "error" ? Promise.reject(error) : Promise.resolve({});
    });
  }

  /**
   * Not great because of 6 params, but I broke it out of the other method, so not as spagetti
   */
  logMessage(context, instruction, endpoint, systemMessage, direction, associatedData: { dataToLog: any, hullEntityToLog: any, results?: any }, error) {

    if (isUndefinedOrNull(associatedData.hullEntityToLog)) {
      // Don't log anything if there's an error with no association to a particular hull entity
      // could be slightly misleading if we were doing a query before pushing the entity (where the entity was not the data inputted)
      // for example on a lookup, could decide we want to know what we are pushing in a deeper way, by looking at the input query is related to...
      // but difficult to know for sure the specific entity it relates to
      // ... could push new input() everytime we're doing a specific account lookups... then always rely on input?
      // ... other cases would be batch cases where we already need to develop logic to join errors back to the batch
      // but could also lead to throwing errors without a known context
      // either way, this is bubbled to the top and shown....
      // if (error) {
      //   const message = isUndefinedOrNull(_.get(error, "message")) ? {} : { error: error.message };
      //   context.reqContext().client.logger.error(systemMessage, { endpoint: instruction.name, operation: endpoint.operation, message });
      // }
      return;
    }

    // need this data type to override individual datatype if hullEntityToLog is an array, and type is at top
    const hullDataType = getHullDataType(associatedData.hullEntityToLog);
    let hullArrayToLog = associatedData.hullEntityToLog;
    if (!Array.isArray(hullArrayToLog)) {
      hullArrayToLog = [hullArrayToLog];
    }
    const dataToLog = associatedData.dataToLog;

    // if a batch error, this is where we'd join the error state back to the data...
    // not sure how we template that behavior
    _.forEach(hullArrayToLog, hullData => {
      const entitySpecificLogger = this.createEntitySpecificLogger(context, hullData, hullDataType);

      // need some sort of condition so that we don't send a batch of messages for each hull message
      // if (endpoint.batch === true) {
      //
      // }
      if (entitySpecificLogger) {
        const data = dataToLog;
        const dataType = getHullDataType(data);
        let type;
        if (dataType) {
          type = dataType.name;
        }
        if (error) {
          const errorMessage = _.get(error, "message");
          entitySpecificLogger.error(systemMessage, { data, type, operation: endpoint.operation, error: errorMessage });
        } else if (direction === "outgoing") {
          // lets not log response, that seems a little excessive and could fill our log pipeline up to an unknown degree
          // entitySpecificLogger.info(systemMessage, { data, type, response: _.get(associatedData, "results.body"), operation: endpoint.operation });
          entitySpecificLogger.info(systemMessage, { data, type, operation: endpoint.operation });
        } else {
          entitySpecificLogger.info(systemMessage, { data, type });
        }
      }
    });

  }

  /**
   *
   * @param context
   * @param data
   * @param dataType  allow an optional parameter to overwrite the datatype on the data, used for an array scenario if the type is at the array level
   * but we can control the entity specific logging though because incoming we do one at a time, and outgoing, we can control? or one or the other? not sure...
   * @returns {*}
   */
  createEntitySpecificLogger(context: any, data: any, dataType?: any) {
    let hullType = dataType;

    if (!hullType) {
      hullType = getHullDataType(data);
    }

    // ok to do this because inside of hullDataType which is only defined if inputParam is there
    if (sameHullDataType(hullType, HullOutgoingUser)) {
      const identity = _.get(data, "user");
      if (!_.isEmpty(identity)) {
        return context.reqContext().client.asUser(identity).logger;
      }
    } else if (sameHullDataType(hullType, HullIncomingUser)) {
      const identity = _.get(data, "ident");
      if (!_.isEmpty(data)) {
        return context.reqContext().client.asUser(identity).logger;
      }
    } else if (sameHullDataType(hullType, HullOutgoingAccount)) {
      const identity = _.get(data, "account");
      // if inputParam is an array, must get the right obj
      // in the array for this log...
      if (!_.isEmpty(data)) {
        return context.reqContext().client.asAccount(identity).logger;
      }
    }
    else if (sameHullDataType(hullType, HullIncomingAccount)) {
      const identity = _.get(data, "ident");
      // if inputParam is an array, must get the right obj
      // in the array for this log...
      if (!_.isEmpty(identity)) {
        return context.reqContext().client.asAccount(identity).logger;
      }
    }
  }


  sendData(context: HullVariableContext, instruction: Object, data: any) {

    const instructionOptions = instruction.options;

    const name = instructionOptions.name;
    const serviceDefinition = this.services[name];

    return this.createOperationPromise(context, instruction, data)
      .then(results => {
        // find a better way to pass an already determined error template to recovery code
        // maybe a local wrapper error that's specifically for this condition
        // need to keep this same logic as "finalErrorTemplate" handling below
        if (!isUndefinedOrNull(this.findErrorTemplate(context, serviceDefinition, results))) {
          return Promise.reject(results);
        }
        return Promise.resolve(results);
      })
      .catch(error => {

      debug(`[SERVICE-ERROR]: ${name} [ERROR]: ${JSON.stringify(error)}`);

      if (name !== 'hull') {
        context.reqContext().metric.increment("service.service_api.errors", 1);
      }

      const errorTemplate = this.findErrorTemplate(context, serviceDefinition, error);

      if (!isUndefinedOrNull(errorTemplate)) {
        const route: string = _.get(errorTemplate, "recoveryroute");
        let errorHandlingPromise;

        if (!_.isEmpty(route) && !_.isEqual(route, context.get("recoveryroute"))) {
          // 2 cases,
          // where the recovery promise exists and it's a different path calling
          // and where it IS the recovery path....
          // should probably look at some sort of time stamp if the recovery promise was done a while ago or something...
          if (isUndefinedOrNull(this.recoveryPromise)) {
            debug(`[SERVICE-ERROR]: ${name} [RECOVERY-ROUTE-ATTEMPT]: ${route}`);
            // pushing a new context so that we don't put the recovery route in anyone else's context
            // which may be running
            context.pushNew();
            context.set("recoveryroute", route);

            //couldn't get finally to work consistently, so using then/catch
            this.recoveryPromise = this.dispatcher.resolve(context, new Route(route))
              .then((results) => {
                context.popLatest();
                return Promise.resolve(results);
              }).catch((err) => {
                context.popLatest();
                return Promise.reject(err);
              });


            // TODO problem here is that if there's another long running request pending that we don't get the new access token
            // and when we fail, it shows we already did the recovery promise, and then that context doesn't get the update
            // could really shorten the recovery promise window... might work... is that the right thing to do?
            // do we tie the recovery promise to a particular context?  Or refresh the context somehow?
            // would wipe the variables....
            const recoveryPromiseTtl = parseIntOrDefault(process.env.RECOVERY_ROUTE_TTL, 3600000);

            this.clearRecoveryPromiseHandle = setTimeout(() => {
              debug("Clearing recovery promise so that it can be used again");
              this.recoveryPromise = null;
            }, recoveryPromiseTtl);
          }

          // .then creates a new promise reference... must keep track of it
          // can't do:
          // promise.then();  promise.then()
          // must do promise.then().then()
          // or
          // promise = promise.then(); promise = promise.then()

          //TODO does keeping this promise around keep the data that was the result in memory
          errorHandlingPromise = this.recoveryPromise.then(() => {
            return this.createOperationPromise(context, instruction, data);
          });

        } else if (errorTemplate.retryAttempts && errorTemplate.retryAttempts > 0) {
          errorHandlingPromise = this.retrySendingData(errorTemplate.retryAttempts - 1, 1000, context, instruction, data);
        }

        if (!isUndefinedOrNull(errorHandlingPromise)) {
          return errorHandlingPromise
            .then(results => {
              if (!isUndefinedOrNull(this.findErrorTemplate(context, serviceDefinition, results))) {
                return Promise.reject(results);
              }
              return Promise.resolve(results);
            })
            .catch((finalError) => {
            // may have been able to partially recover, log the final error
            // which may have been different than the original
            // might be an argument to have several recovery routes that all converge on success at some point
            // not now though, too early to understand if that would be really helpful or not...
            const finalErrorTemplate = this.findErrorTemplate(context, serviceDefinition, finalError);
            const finalErrorException = this.createErrorException(context, name, serviceDefinition.error, finalErrorTemplate, finalError);
            return Promise.reject(finalErrorException);
          });
        }
      }

      const errorException = this.createErrorException(context, name, serviceDefinition.error, errorTemplate, error);
      return Promise.reject(errorException);

    });
  }

  createOperationPromise(context: HullVariableContext, instruction: Object, data: any) {

    const instructionOptions = instruction.options;
    const name = instructionOptions.name;
    const op = instructionOptions.op;
    const serviceDefinition = this.services[name];

    if (!_.isEmpty(data)) {
      let paramString = JSON.stringify(data);
      if (paramString && paramString.length > 60) {
        paramString = `${paramString.substring(0, 60)}...`;
      }
      debug(`[CALLING-SERVICE]: ${name}<${op}> [WITH-DATA]: ${paramString}`);
    } else {
      debug(`[CALLING-SERVICE]: ${name}<${op}>`);
    }

    // instantiates the service using the definition and the context
    // then dispatch the request
    let servicePromise = serviceDefinition.initialize(context, serviceDefinition).dispatch(op, data);

    const requestTrace = context.reqContext().request_trace;

    return servicePromise.then((results) => {
      if (requestTrace) {
        requestTrace.serviceRequests.push({
          localContext: context.cloneLocalContext(),
          name,
          op,
          input: data,
          result: results
        });
      }
      return Promise.resolve(results);
    }).catch((error)  => {
      if (requestTrace) {
        requestTrace.serviceRequests.push({
          localContext: context.cloneLocalContext(),
          name,
          op,
          input: data,
          error
        });
      }
      return Promise.reject(error);
    });

  }

  retrySendingData(retryAttempts: number, sleepTime: number, context: Object, instruction: Object, data: any) {

    // returns a promise which will wait the sleep time before calling the new retry promise
    // sleep time increases *2 everytime for a good backoff
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.createOperationPromise(context, instruction, data).catch( error => {
          if (retryAttempts === 0) {
            return Promise.reject(error);
          }
          return this.retrySendingData(retryAttempts - 1, sleepTime*2, context, instruction, data);
        }));
      }, sleepTime);

    });
  }

  createErrorException(context: Object, servicename: string, errorDefinitions: Object, errorTemplate: any, error: any) {

    if (isUndefinedOrNull(error)) {
      const message: string = `Unknown error while connecting with the ${servicename} API`;
      // throw new error if an error obj does not exist, not sure what the case for this is...
      return new Error(message);
    } else if (isUndefinedOrNull(errorDefinitions)) {
      const message: string = `Untemplated error while connecting with the ${servicename} API`;
      // if there is no errordefinition, then no way to parse anything out, just throw the original error
      return error;
    }

    const output = this.parseError(error, errorDefinitions.parser, {});
    const logMessage = this.createLogFromOutput(servicename, output);

    if (isUndefinedOrNull(errorTemplate)) {
      // may have parsed parameters from the parser, but no specific error condition with message
      // probably want to both return what was parsed, but also the original error somehow
      // for now, if we parsed description or title, can return that...
      if (!_.isEmpty(output.description)) {
        if (!_.isEmpty(output.title)) {
          console.log(error.stack);
          return new LogicError(`[${output.title}] ${output.description}`, "action", error);
        } else {
          return new LogicError(output.description, "action", error);
        }
      } else if (!_.isEmpty(output.title)) {
        return new LogicError(output.title, "action", error);
      } else {
        return error;
      }

    } else {
      let message;
      if (typeof errorTemplate.message === "string") {
        message = errorTemplate.message;
      } else {
        message = errorTemplate.message().message;
      }
      return new errorTemplate.errorType(message, error);
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
            try {
              target = JSON.parse(target);
            } catch (error) {
              return output;
            }
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
        let truthy = template.truthy;
        let condition = template.condition;

        if (!isUndefinedOrNull(truthy)) {
          if (!_.isMatch(error, truthy)){
            return false;
          }
        }
        if (!isUndefinedOrNull(condition)) {
          if (!condition(context)) {
            return false;
          }
        }
        return true;
      });
    }
    return null;
  }

}

module.exports = {
  ServiceEngine
};
