// @flow

import _ from "lodash";
import jsonata from "jsonata";
import compute from "./compute";

function computePayload({ locals, payload }) {
  try {
    console.log(locals);
    return {
      ..._.reduce(
        // Ignore blank target lines in Locals
        _.filter(locals, ({ target, source }) => target && source),
        (obj, { target, source }) => {
          obj[target] = jsonata(source).evaluate(payload);
          return obj;
        },
        {}
      )
    };
    // return jsonata(code).evaluate(payload);
  } catch (err) {
    throw new Error(
      `Error in Computed Attribute Payload JSONATA: ${err.message}`
    );
  }
}

async function computeTraits({ payload, fallbacks, locals }) {
  try {
    return compute({
      locals,
      payload,
      fallbacks
    });
  } catch (err) {
    throw new Error(`Error while Computing Attributes: ${err.message}`);
  }
}

export default async function buildResponse({ locals, payload, fallbacks }) {
  const data = computePayload({ locals, payload });
  const traits = await computeTraits({
    payload: {
      ...payload,
      ...data
    },
    locals,
    fallbacks
  });
  return {
    traits,
    data
  };
}
