// @flow

import jsonata from "jsonata";
import compute from "./compute";

function computePayload({ code, payload }) {
  try {
    return jsonata(code).evaluate(payload);
  } catch (err) {
    throw new Error(
      `Error in Computed Attribute Payload JSONATA: ${err.message}`
    );
  }
}

async function computeTraits({ payload, fallbacks, code }) {
  try {
    return compute({
      code,
      payload,
      fallbacks
    });
  } catch (err) {
    throw new Error(`Error while Computing Attributes: ${err.message}`);
  }
}

export default async function buildResponse({ code, payload, fallbacks }) {
  const data = computePayload({ code, payload });
  const traits = await computeTraits({ payload: data, code, fallbacks });
  return {
    traits,
    data
  };
}
