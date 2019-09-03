/* @flow */

const _ = require("lodash");

const { hullService } = require("../purplefusion/hull-service");
const { HullDispatcher } = require("../purplefusion/dispatcher");
const { setHullDataType } = require("../purplefusion/utils");
const { ContextMock } = require("./connector-mock");

// TODO This is vulnerable to weird edge cases where if you have an array with a jest expect, could get weird errors
// like: localContext: [expect.objectContaining(..)]
// would enumerate the objectContaining fields, resulting in a bad comparison
// stuff like: "TypeError: val.toAsymmetricMatcher is not a function"
// in this case, don't surround the expect with an array, and it won't be flattened
// instead just localContext: expect.objecContaining(...)
function flattenArray(possibleArray) {
  if (Array.isArray(possibleArray)) {
    let flattened = {};
    _.assign(flattened, ...possibleArray);
    return flattened;
  } else {
    return possibleArray;
  }

}

function createServiceMock(service, possibleMockRequests) {

  // use Object.create to follow a javascript inheritance pattern
  // all data is passed through
  const serviceWrapper = Object.create(service);

  // we add this parameter to get a list of all called mocks
  // then we verify at the end that they've all been called
  serviceWrapper.requestedMocks = _.clone(possibleMockRequests);

  // need to override the initialize method so that our mocks get initialized instead of the normal services
  serviceWrapper.initialize = (context, api) => {
    return {
      dispatch: (endpointName: string, data: any) => {

        const localContext = context.cloneLocalContext();

        const possibleEndpointMocks = _.filter(serviceWrapper.requestedMocks, { op: endpointName });

        // writing the expect like this so we can see the endpoint name if it couldn't find it
        expect(possibleEndpointMocks).toEqual(
          expect.arrayContaining([expect.objectContaining({ op: endpointName })])
        );

        // TODO this may not always work if order is not guarantee
        // especially when doing parallel processing
        // could potentially look through all possibles for the right endpoint, not just first

        let currentLocalContext = flattenArray(localContext);

        let identifiedResult = null;
        if (possibleEndpointMocks.length > 1) {

          _.some(possibleEndpointMocks, possibleEndpoint => {

            // Multiple possible endpoints, so test each one to see if it matches
            try {
              let storedLocalContext = flattenArray(possibleEndpoint.localContext);
              expect(currentLocalContext).toEqual(storedLocalContext);
              expect(data).toEqual(possibleEndpoint.input);
              identifiedResult = possibleEndpoint;
              return true;
            } catch (err) {
            }
          });

          // throwing an error here because we did not find a valid endpoint for this call
          // expecting endpoint name and data to give the user more
          if (identifiedResult === null) {
            expect({ localContext: currentLocalContext, op: endpointName, input: data }).toEqual(null);
          }

        } else {

          identifiedResult = _.first(possibleEndpointMocks);

          // In this case, this is the only endpoint mock that we've found which has the same op name
          // if there are multiple calls to this op, then check to see that you have the same number of calls to the service
          // as you do mock endpoints, if you hav emore calls to the service than you do mocks, and it's not matching
          // it will companre your latest call to the service with the last mock that hasn't been called, but you may not have added the mock endpoint
          // so the one that this is comparing to may be misleading
          // local context must be equal or using a jest equivalence object
          expect(currentLocalContext).toEqual(flattenArray(identifiedResult.localContext));
          // input must be equal or using a jest equivalence object
          expect(data).toEqual(identifiedResult.input);
        }



        // remove the endpoint from the list because it's been called
        _.pull(serviceWrapper.requestedMocks, identifiedResult);

        // now return the appropriate result
        const result = identifiedResult.result;
        if (result && result.text) {
          // super agent does not serialize the body of the request, so we parse the "text" attribute and set it as the body
          result.body = JSON.parse(result.text);
        }

        return Promise.resolve(result);
      }
    }
  };
  return serviceWrapper;
}

class PurpleFusionTestHarness {

  constructor(glue, services, transforms, ensureHook) {
    this.glue = glue;
    this.services = services;
    this.transforms = transforms;
    this.ensureHook = ensureHook;

    // TODO In constructor, validate the glue commands against services etc...
    // should fail circle ci if have bad calls to service....
  }

  runTest(requestTrace) {

    // add the hull service
    // potentially in the future mock the hull service with callbacks from the mock context
    // but that means the mock context will also have to search through the requests to verify the right output
    // maybe the code can be modulerized to be used by a mocked hull client and a mocked service?
    // maybe not if there's transform after the asUser stuff, because we don't have that output...
    // but I don't think there's any output from asUser etc... so maybe that's ok
    const serviceMocks = { hull: createServiceMock(hullService, _.filter(requestTrace.serviceRequests, { name: "hull" })) };

    // add any other services needed for mocking
    _.forEach(this.services, (service, key) => {
      serviceMocks[key] = createServiceMock(service, _.filter(requestTrace.serviceRequests, { name: key }));
    });

    const hullDispatcher = new HullDispatcher(
      this.glue,
      serviceMocks,
      this.transforms,
      this.ensureHook
    );

    const context = new ContextMock(requestTrace.configuration);

    let request = requestTrace.input;
    if (request && request.classType && request.data) {
      const classType = request.classType;
      const data = request.data;
      setHullDataType(data, classType);
      request = data;
    }

    return hullDispatcher.dispatch(context, requestTrace.route, request)
      .then((results) => {
        hullDispatcher.close();
        // This makes sure that all mocks have been called
        // this array should be empty at the end
        // we remove the calls that have been made
        // any remaining calls are service requests that we did not make
        _.forEach(serviceMocks, service => {
          expect(service.requestedMocks).toEqual([]);
        });

        // This checks the actual object response from the endpoint
        expect(results).toEqual(requestTrace.result);
        return Promise.resolve(results);
      }).catch(error => {
        hullDispatcher.close();

        // this could hide errors as a result of bad jest expectations...
        // because a bad expect inside will throw here in cases where the end result is an error
        // This is specifically why we expect the error first a couple lines down from here
        // will show specifically what we got compared to what we expected
        // what we got is potentially the bad thing
        if (requestTrace.error) {

          // This checks the actual object response from the endpoint
          expect(error).toEqual(requestTrace.error);

          _.forEach(serviceMocks, service => {
            expect(service.requestedMocks).toEqual([]);
          });

          // if we survived the error expectation, we can resolve
          // otherwise it will throw an error
          return Promise.resolve({});
        }

        return Promise.reject(error);
      });

  }

}

module.exports = {
  PurpleFusionTestHarness
};
