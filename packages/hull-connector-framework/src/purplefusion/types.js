/* @flow */
import type { HullServiceObjectDefinition, HullAccount, HullUser } from "hull";

/*
 *** Outreach.io Types, specific to this connector
 */

export type OutreachObjectType = "Account" | "Prospect";

export type PropertyTransformationStrategy =
  | "PropertyKeyedValue"
  | "PropertyKeyedGroup"
  | "ArrayPropertyGroup"
  | "Jsonata";
export type ArrayTransformationStrategy =
  | "send_raw_array"
  | "append_index"
  | "json_stringify"
  | "join_with_commas"
  | "pick_first";
export type Direction = "incoming" | "outgoing";

export type TransformRule = $Shape<{
  inputPath: string,
  outputPath: string,
  outputFormat: any,
  mapping: string | Object,
  arrayStrategy: ArrayTransformationStrategy,
  condition: any
}>;

export type ServiceObjectDefinition = HullServiceObjectDefinition;

export type Transform = {
  input: ServiceObjectDefinition,
  output: ServiceObjectDefinition,
  strategy: PropertyTransformationStrategy,
  arrayStrategy: ArrayTransformationStrategy,
  direction: Direction,
  transforms: Array<TransformRule>
};

export type ServiceTransforms = Array<Transform>;

/**
 * Idea here is to be able to have our own standard language for the types of
 * endpoints we connect with.  Will leave this here for now
 * May not end up being useful...
 * @type {String}
 */
export type EndpointType =
  | "fetchAll"
  | "webhook"
  | "byLastSync"
  | "byId"
  | "byIds"
  | "byProperty"
  | "byProperties"
  | "create"
  | "createAll"
  | "update"
  | "updateAll"
  | "upsert"
  | "upsertAll";
export type RequestType = "post" | "get" | "patch" | "delete" | "put";

export type RawRestApi = {
  initialize: Function,
  prefix: string,
  superagent: {
    settings: Array<any>,
    headersToMetrics: Object
  },
  authentication: Object,
  error: Object,
  endpoints: {
    [propertyName: string]: {
      url: string,
      operation: RequestType,
      endpointType: EndpointType,
      returnObj?: string,
      query?: string,
      input?: ServiceObjectDefinition,
      output?: ServiceObjectDefinition
    }
  }
};

export type CustomApi = {
  initialize: Function,
  isAuthenticated: {},
  retry: {},
  error: {},
  endpoints: {
    [propertyName: string]: {
      method: string | Function,
      endpointType: EndpointType,
      input?: ServiceObjectDefinition,
      output?: ServiceObjectDefinition
    }
  }
};

export type SqlExporterAdapter = {
  getConnectionString: Function,
  isValidConfiguration: Function
};

export type Connector = {
  glue: Object,
  service: RawRestApi,
  transformations: Array<Transform>,
  ensure: string
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
