/* @flow */
import type { HullAccount, HullUser } from "hull";

/*
 *** Outreach.io Types, specific to this connector
 */

export type OutreachObjectType = "Account" | "Prospect";

export type Condition = {
  if: any,
  true: any,
  false: any
};

export type PropertyTransformationStrategy = "PropertyKeyedValue" | "PropertyKeyedGroup" | "ArrayPropertyGroup";

export type Transform = {
  input: Class<any>,
  output: Class<any>,
  strategy: PropertyTransformationStrategy,
  template: Object
};

export type ServiceTransforms = Array<Transform>;

/**
 * Idea here is to be able to have our own standard language for the types of
 * endpoints we connect with.  Will leave this here for now
 * May not end up being useful...
 * @type {String}
 */
export type EndpointType = "fetchAll" | "webhook" | "byLastSync" | "byId" | "byIds" | "byProperty" | "byProperties" | "create" | "createAll" | "update" | "updateAll" | "upsert" | "upsertAll";
export type RequestType = "post" | "get" | "patch" | "delete" | "put";

export type RawRestApi = {
  initialize: Function,
  prefix: string,
  superagent: {
    settings: Array<any>,
    headersToMetrics: Object
  },
  authentication: Object,
  retry: Object,
  error: Object,
  endpoints: {
    [propertyName: string]: {
      url: string,
      operation: RequestType,
      endpointType: EndpointType,
      returnObj?: string,
      query?: string,
      input?: Class<any>,
      output?: Class<any>
    }
  }
};

export type CustomApi = {
  initialize: Function,
  isAuthenticated: {

  },
  retry: {

  },
  error: {

  },
  endpoints: {
    [propertyName: string]: {
      method: string | Function,
      endpointType: EndpointType,
      input?: Class<any>,
      output?: Class<any>
    }
  }
};

export type Connector = {
  glue: Object,
  service: RawRestApi,
  transformations: Array<Transform>
};

// // Takes hull objects, transforms them using transforms-to-service
// // then pushes them out to the service and returns
// // TODO need strategies for paging, authentication, retry logic and errors
//
// // input one id
// // only returns 1
// function byId(id){};
//
// // input many ids
// // returns many
// function byIds(ids){};
//
// // returns many different data structures
// // could be different endpoints
// function byProperty(name, value){};
// function byProperties(properties){};
//
// // only when does not exists (post)
// // (input: data & returns: possible data structure to be returned)
// function create(data){};
// function createAll(datas){};
//
// // only when existing already (patch)
// // (input: id/data & returns: possible data structure to be returned)
// function update(id, data){};
// function updateAll(datas){};
//
// // upsert (input: data & returns: possible data structure to be returned)
// function upsert(data){};
// function upsertAll(datas){};
