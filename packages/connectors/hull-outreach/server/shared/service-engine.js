
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
          dataTransforms.set(transformedObject, obj);
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
                  logger = context.client.asUser(inputParam).logger;
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
        const route: string = this.onErrorGetRecovery(serviceDefinition, error);

        const retrying = _.get(context, "retrying");
        if ((isUndefinedOrNull(retrying) || !retrying) && !_.isEmpty(route)) {

          _.set(context, "retrying", true);
          debug(`[SERVICE-ERROR]: ${name} [RECOVERY-ROUTE-ATTEMPT]: ${route}`);

          //don't input data on an attempt to recover...
          return this.resolve(context, new Route(route), null).then(() => {
            _.set(context, "retrying", false);
            return retryablePromise();
          }).catch(error => {
            _.set(context, "retrying", false);
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
