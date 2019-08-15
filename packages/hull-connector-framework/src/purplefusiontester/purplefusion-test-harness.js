/* @flow */

const _ = require("lodash");

const { hullService } = require("../purplefusion/hull-service");
const { HullDispatcher } = require("../purplefusion/dispatcher");
const { ServiceData } = require("../purplefusion/utils");
const { ContextMock } = require("./connector-mock");


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
        const firstIdentifiedEndpoint = _.first(possibleEndpointMocks);
        expect(localContext).toEqual(firstIdentifiedEndpoint.localContext);
        expect(data).toEqual(firstIdentifiedEndpoint.input);

        // remove the endpoint from the list because it's been called
        _.pull(serviceWrapper.requestedMocks, firstIdentifiedEndpoint)

        // now return the appropriate result
        const result = firstIdentifiedEndpoint.result;
        if (result.text) {
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
    _.forEach(this.services,(service, key) => {
      serviceMocks[key] = createServiceMock(service, _.filter(requestTrace.serviceRequests, { name: key }));
    });

    const hullDispatcher =  new HullDispatcher(
      this.glue,
      serviceMocks,
      this.transforms,
      this.ensureHook
    );

    const context = new ContextMock(requestTrace.configuration);

    let request = requestTrace.input;
    if (request && request.classType) {
      request = new ServiceData(request.classType, request.data);
    }

    return hullDispatcher.dispatch(context, requestTrace.route, request)
      .then((results) => {
        // make sure all mocks have been called
        _.forEach(serviceMocks, service => {
          expect(service.requestedMocks).toEqual([]);
        });
        expect(requestTrace.result).toEqual(results);
        return Promise.resolve(results);
      });
  }

}

module.exports = {
  PurpleFusionTestHarness
};
