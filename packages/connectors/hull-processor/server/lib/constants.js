// @flow

const EXCLUDED_EVENTS = [
  "Attributes changed",
  "Entered segment",
  "Left segment",
  "Segments changed"
];

const PROP_TYPE_DETECT_ORDER = [
  "bool_value",
  "date_value",
  "num_value",
  "text_value"
];

const CONSTANTS = {
  EXCLUDED_EVENTS,
  PROP_TYPE_DETECT_ORDER
};

export default CONSTANTS;
