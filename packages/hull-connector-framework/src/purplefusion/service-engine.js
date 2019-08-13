/* @flow */
const uuid = require("uuid/v1");

const ps = require("promise-streams");
const map = require("through2-map");
const through2 = require("through2");

import type {
  ServiceTransforms
} from "./types";

const _ = require("lodash");

const BatchStream = require("batch-stream");
const csv = require('csv-stream');
const promisePipe = require("promisepipe");
const pumpPromise = require('pump-promise');

const devnull = require('dev-null');

const { Writable } = require("stream");

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

const { startImportJob } = require("./service-utils");
const { uploadToS3 } = require("./s3");

const HullVariableContext = require("./variable-context");

const { Route } = require("./language");

const { isUndefinedOrNull, ServiceData, parseIntOrDefault } = require("./utils");

const { TransformImpl } = require("./transform-impl");
const { HullDispatcher } = require("./dispatcher");


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

  // Both promiseToWritableStrema and BatchStream need a highwatermark
  // Batch stream because if it doesn't have one, it will buffer everything that comes in
  // even though you can control the promiseToWritableStream with it's own watermark
  // batch will still pull in everything (no default) until you die
  // can control also at promiseToWritableStream, but a little confusing
  // it's default highwatermark is 16, but with each batch being 100, it's processing 1600 messages in parallel
  // so even if reducing highwatermark to 1 at batch, it's still processing a lot
  // probably need ot set both down to 1 to process 100 at a time
  promiseToWritableStream(promise) {
    const writable = new Writable({
      objectMode: true,
      // removing the highwatermark for now because it doesn't make as much sense for incoming
      // where we're downloading something from a source that could be slow (marketo)
      // we don't want to give backpressure because it could cause the stream to fail
      highWaterMark: 1
    });

    writable._write = (chunk, encoding, callback) => {
      promise(chunk, encoding)
        .then(() => {
          callback();
        })
        .catch(error => {
          callback(error);
        });
    }

    return writable;

  }


  async resolveInstruction(context: HullVariableContext, instruction: Object, param: any) {

    let inputParams = param;


    const isArrayInput = Array.isArray(inputParams)
    if (isArrayInput) {
      inputParams = inputParams[0];
    }
    // Code originally from
    // -- https://stackoverflow.com/questions/16010915/parsing-huge-logfiles-in-node-js-read-in-line-by-line
    // Or possibly use: https://github.com/lbdremy/node-csv-stream
    //TODO maybe check the inputParams.classType for these type of variables
    // not necessarily the endpoint? though this isn't the endpoint
    // the class itself could contain all of the potential processing info
    // for that class, including validation...
    if (inputParams && inputParams.classType && inputParams.classType.stream === 'csv') {

      const options = {
        delimiter: ',', // default is ,
        endLine: '\n', // default is \n,
        escapeChar: '"', // default is an empty string
        enclosedChar: '"' // default is an empty string
      };

      const csvStream = csv.createStream(options);

      // removing the highwatermark for now because it doesn't make as much sense for incoming
      // where we're downloading something from a source that could be slow (marketo)
      // we don't want to give backpressure because it could cause the stream to fail
      // const batch = new BatchStream({ size: 200, highWaterMark: 2 });
      const batch = new BatchStream({ size: 10, highWaterMark: 2 });


      // TODO Below is some really ugly, hacky copy/paste code that streams to s3 and imports
      // really need to come back and clean this up
      // it ONLY works for users, and only if coming from a source stream
      // works decently for that case so far, but haven't hit many error cases yet
      const instructionOptions = instruction.options;
      const name = instructionOptions.name;
      const op = instructionOptions.op;
      const serviceDefinition = this.services[name];

      if (isUndefinedOrNull(serviceDefinition))
        throw new Error(`Undefined ServiceDefinition: ${name}<${op}>`);

      let endpoint = _.get(serviceDefinition, `endpoints.${op}`);

      if (!isUndefinedOrNull(endpoint) && endpoint.type === "stream") {
        const transform = map({ objectMode: true }, (object) => {

          let classType;
          if (inputParams instanceof ServiceData) {
            classType = inputParams.classType;
          }

          if (!isUndefinedOrNull(endpoint.input)) {
            return this.transforms.transform(context, object, classType, endpoint.input);
          }
        });

        const batchSize = parseIntOrDefault(process.env.IMPORT_API_UPLOAD_BATCH_SIZE, 10000);
        const importId = uuid();
        let numBatches = 0;
        let numUsers = 0;

        let currentStream = null;
        let currentPromise;

        return pumpPromise(inputParams.data, csvStream, transform,
          through2({ objectMode: true, highWaterMark: 10 }, function rotate(user, enc, callback) {
            if (currentStream === null || numUsers % batchSize === 0) {

              numBatches += 1;
              if (currentStream) {
                currentStream.end();
                this.push(currentPromise);
              }

              const newUpload = uploadToS3(context.reqContext().connector.id, numBatches);
              currentStream = newUpload.stream;
              currentPromise = newUpload.promise;
            }

            // if (!currentPromise || numUsers % batchSize === 0) {
            //
            //   numBatches += 1;
            //   if (currentPromise) {
            //     this.push(currentPromise);
            //   }
            //   currentPromise = Promise.resolve({ url: "tim", partNumber: numBatches, size: 100 })
            // }

            const userString = JSON.stringify(user);
            numUsers += 1;
            if (numUsers % 1000 === 0) {
              debug(`Streamed users: ${numUsers}`);
            }
            // debug(`Streaming user: ${userString.substr(0, 60)}`);
            currentStream.write(`${userString}\n`);
            callback();
          }, function finish(callback) {
            debug(`Finished Streaming: ${numUsers}`);
            if (currentStream && currentStream.end) {
              // Readable does not implement end function,
              // so we need to be careful here.
              currentStream.end();
            }
            this.push(currentPromise);
            callback();
          }),
          ps.map({}, (result) => {

            debug(`Importing result: ${JSON.stringify(result)}`);
            if (!result) {
              return Promise.reject();
            }
            const { url, partNumber, size } = result;
            return startImportJob(context.reqContext(), url, partNumber, size, importId);
            // return Promise.resolve({});
          }),
          devnull({ objectMode: true})

        ).then((results) => {
          return Promise.resolve(results);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      // using pumpPromise because the pump library is well maintained at 14mil weekly downloads
      // and the wrapper for it (pumpPromise) is very simple and it works
      return pumpPromise(inputParams.data, csvStream, batch, this.promiseToWritableStream((data) => {
        return this.getResults(context, instruction, new ServiceData(inputParams.classType, data));
      })).then((results) => {
        return Promise.resolve(results);
      }).catch((err) => {
        return Promise.reject(err);
      });

      // Not using promisePipe anymore because it is not detecting the end condition properly
      // I've debugged it, and seems like the resolve is being called 2x for the csvStream because
      // it has both close and finish called, but doesn't seem to be that weird
      // also superagent throws warnings that end is being called more than once which it doesn't support
      // either way, promise pipe doesn't seem to handle it well.  the pipe still runs, but doesn't return right
      // not that this was the problem but cleanupEventHandlers seemed a little weird, probably should have made it so resolve wasn't called 2x
      // get this: Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises
      // return promisePipe(inputParams.data, csvStream, batch, this.promiseToWritableStream((data) => {
      //   return this.getResults(context, instruction, new ServiceData(inputParams.classType, data));
      // }));

      // This was an attempt to debug this issue.
      // the following code worked and resolved the promise
      // return new Promise((resolve, reject) => {
      //   inputParams.data.on("error", err => {
      //     console.log("error download: " + JSON.stringify(err));
      //   }).on("end", err => {
      //     console.log("ending download: " + JSON.stringify(err));
      //   }).pipe(csvStream).on("error", err => {
      //     console.log("error csv: " + JSON.stringify(err));
      //   }).on("end", err => {
      //     console.log("ending csv: " + JSON.stringify(err));
      //   }).pipe(batch).on("error", err => {
      //     console.log("error batch: " + JSON.stringify(err));
      //   }).on("end", err => {
      //     console.log("ending batch: " + JSON.stringify(err));
      //   }).pipe(this.promiseToWritableStream((data) => {
      //     return this.getResults(context, instruction, new ServiceData(inputParams.classType, data));
      //   })).on("error", err => {
      //     console.log("error writable: " + JSON.stringify(err));
      //     reject();
      //   }).on("end", err => {
      //     console.log("ending writable: " + JSON.stringify(err));
      //   }).on("finish", err => {
      //     console.log("finish writable: " + JSON.stringify(err));
      //     resolve();
      //   })
      // });

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
      if (param instanceof ServiceData) {
        endpoint.input = param.classType;
      }
    }

    // The logic below pulls out the data and class type if the input is a service data
    let rawInputParam = param;
    let rawInputType;
    if (param instanceof ServiceData) {
      rawInputParam = param.data;
      rawInputType = param.classType;
    }

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

        if (rawInputType) {
          return this.transformAndLogAndSendData(context, instruction, new ServiceData(rawInputType, rawObject), endpoint);
        } else {
          return this.transformAndLogAndSendData(context, instruction, rawObject, endpoint);
        }

      }));
    } else {
      results = await this.transformAndLogAndSendData(context, instruction, param, endpoint);
    }

    if (!_.isEmpty(results)) {

      let newData;

      //TODO this isn't necessarily the right thing...
      // I don't like having an endpoint which may or may not return an array
      if (results.length === 1) {
        newData = results[0];
      } else {
        newData = results;
      }

      if (endpoint) {
        if (endpoint.streamType) {
          newData = newData.stream;
        } else if (!_.isEmpty(endpoint.returnObj)) {
          newData = _.get(newData, endpoint.returnObj);
        } else if (!_.isEmpty(serviceDefinition.defaultReturnObj)) {
          newData = _.get(newData, serviceDefinition.defaultReturnObj);
        }

        let dataType = endpoint.output;

        if (endpoint.transformTo) {
          newData = this.transforms.transform(context, newData, endpoint.output, endpoint.transformTo)
          dataType = endpoint.transformTo;
        }

        if (!isUndefinedOrNull(dataType)) {
          return new ServiceData(dataType, newData);
        }
      }

      return newData;

    }

    return results;
  }

  getHullDataType(classType: Object) {
    if (
      classType.name === HullOutgoingUser.name
      || classType.name === HullIncomingUser.name
      || classType.name === HullOutgoingAccount.name
      || classType.name === HullIncomingAccount.name) {
      return classType.service_name;
    }
    return undefined;
  }


  transformAndLogAndSendData(context: HullVariableContext, instruction: Object, inputParam: any, endpoint: any) {
    const direction = (instruction.options.name === "hull") ? "incoming" : "outgoing";

    // This specialized function makes sure to ensure the right context for log i think
    // we can see the exact user we were trying to send and which data was sent
    let logger = context.reqContext().client.logger;
    let dataToSend;
    let dataType;
    let hullDataType;


    if (!isUndefinedOrNull(inputParam)) {

      let objectToTransform;
      let classType;

      if (inputParam instanceof ServiceData) {
        objectToTransform = inputParam.data;

        classType = inputParam.classType;
        dataType = classType.service_name;
        hullDataType = this.getHullDataType(classType);
      } else {
        objectToTransform = inputParam;
      }

      if (!isUndefinedOrNull(endpoint.input)) {
        dataToSend = this.transforms.transform(context, objectToTransform, classType, endpoint.input);

        classType = endpoint.input;
        // set this as the latest dataType because it's the last thing that the object was transformed into
        dataType = classType.service_name;
        hullDataType = this.getHullDataType(classType);

      } else {
        dataToSend = objectToTransform;
      }

      // Not going to be able to pull this data out for a batch call... or would have to look at if it was an array
      // but even so, if packaged as an array inside of an object, would have no visibility...
      // can't do it this way anymore probably....
      // need to unwind this...
    }

    const action = `${direction}.${_.toLower(hullDataType)}`;

    // TODO this area has gotten better, then worse
    // need to rip it all out and put it together somewhere else
    // too much functional inception
    const logMessage = (systemMessage, data, results) => {
      const bestLogger = this.getBestLogger(context, logger, inputParam, data);
      // TODO add logic here to join back to the original data array to log the right message per object
      // if it's a batch endpoint, it will have the instructions to join back
      if (direction === 'outgoing') {
        bestLogger.info(systemMessage, { data, operation: endpoint.operation, type: dataType });
      } else {
        bestLogger.info(systemMessage, { data });
      }

    };

    const logErrorMessage = (systemMessage, data, error) => {
      const bestLogger = this.getBestLogger(context, logger, inputParam, data);
      const message = isUndefinedOrNull(_.get(error, "message")) ? {} : { error: error.message };
      bestLogger.error(systemMessage, { data, operation: endpoint.operation, type: dataType, message });
    };

    return this.sendData(context, instruction, dataToSend).then((results) => {

      const systemMessage = `${action}.success`;

      if (!isUndefinedOrNull(hullDataType)) {

        context.reqContext().metric.increment(`ship.${action}s`, 1);

        // if is an incoming data to hull, then log the final result sent to hull
        // otherwise if outgoing, log the hull data before all the transforms to the service
        // TODO wonder if we could introduce a hook pre/post transform where we could do whatever we wanted
        // depending on the object that's been converted
        const dataToLog = direction === "incoming" ? dataToSend : _.get(inputParam, "data");

        if (Array.isArray(dataToLog)) {
          _.forEach(dataToLog, data => {
            logMessage(systemMessage, data, results);
          });
        } else {
          logMessage(systemMessage, dataToLog, results);
        }
      }
      // this is just for logging, do not suppress error here
      // pass it along with promise resolve
      return Promise.resolve(results);

    }).catch(error => {

      const entityStatus = error instanceof SkippableError ? "skip" : "error";
      const systemMessage = `${action}.${entityStatus}`;

      // TODO add logic here to join back to the original data array too, like above case too
      // hopefully can use same logic, but might have to have different join logic
      if (!isUndefinedOrNull(hullDataType)) {

        const dataToLog = direction === "incoming" ? dataToSend : _.get(inputParam, "data");
        if (Array.isArray(dataToLog)) {
          _.forEach(dataToLog, data => {
            logErrorMessage(systemMessage, data, error);
          });
        } else {
          logErrorMessage(systemMessage, dataToLog, error);
        }

      }

      // if the issue was not an error, resolve, in cases where we marked it as a skippable error
      return entityStatus === "error" ? Promise.reject(error) : Promise.resolve({});
    });
  }

  getBestLogger(context: any, logger: any, inputParam: any, data: any) {
    // ok to do this because inside of hullDataType which is only defined if inputParam is there
    if (inputParam.classType === HullOutgoingUser) {
      if (!_.isEmpty(data)) {
        return context.reqContext().client.asUser(data.user).logger;
      }
    } else if (inputParam.classType === HullOutgoingAccount) {
      // if inputParam is an array, must get the right obj
      // in the array for this log...
      if (!_.isEmpty(data)) {
        return context.reqContext().client.asAccount(data.account).logger;
      }
    }
    return logger;
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
