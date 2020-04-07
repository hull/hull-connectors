// @flow
import type { HullEvent } from "hull";
import _ from "lodash";

import type { HullElasticContext } from "../group-context";
import group_context from "../group-context";

const PROP_TYPE_DETECT_ORDER = [
  "bool_value",
  "date_value",
  "num_value",
  "text_value"
];

const propsReducer = (props, prop) => {
  props[prop.field_name] = _.get(
    prop,
    _.find(PROP_TYPE_DETECT_ORDER, _.has.bind(undefined, prop))
  );
  return props;
};

type HullElasticEvent = {
  indexed_at: string,
  created_at: string,
  event: string,
  app_id: string,
  app_name: string,
  source: string,
  session_id: string,
  type: string,
  props: { [string]: string | null | number | void | Array<string> },
  context: HullElasticContext,
  _id: string
};

const formatEvent = (e: HullElasticEvent): HullEvent => {
  const { context = {}, props = {}, _id, event, created_at, source, type } = e;
  const properties = _.reduce(props, propsReducer, {});
  return {
    event_id: _id,
    event,
    created_at,
    properties,
    event_source: source,
    event_type: type,
    context: group_context(context)
  };
};

export default formatEvent;
