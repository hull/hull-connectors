// @flow
import jsonata from "jsonata";
import _ from "lodash";

type Payload = {};

const getValue = ({ value }) => (_data: Payload) => value;

const getAttribute = ({ attribute }) => (data: Payload) =>
  _.get(data, attribute);
const getFallback = ({ attributes }) => (data: Payload) =>
  _.reduce(attributes, (value, attribute) => {
    if (value !== undefined) {
      return value;
    }
    return getAttribute({ attribute })(data);
  });
const getMapping = ({ attribute, mapping = [] }) => (data: Payload) =>
  _.find(mapping, { source: getAttribute({ attribute })(data) })?.destination;
const getExpression = ({ attribute, expression }) => (data: Payload) =>
  jsonata(expression).evaluate(_.get(data, attribute));

const ARRAY_ACCESSORS = {
  first: 0,
  last: -1
};

const getAtIndex = ({ attribute, accessor, accessor_value }) => (
  data: Payload
) =>
  _.nth(
    _.get(data, attribute),
    ARRAY_ACCESSORS[accessor] !== undefined
      ? ARRAY_ACCESSORS[accessor]
      : accessor_value
  );

export default {
  value: getValue,
  attribute: getAttribute,
  fallback: getFallback,
  mapping: getMapping,
  expression: getExpression,
  atIndex: getAtIndex
};
