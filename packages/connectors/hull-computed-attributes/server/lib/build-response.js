// @flow

import compute from "./compute";

export default async function buildResponse({ payload, computedAttributes }) {
  try {
    return compute({
      payload,
      computedAttributes
    });
  } catch (err) {
    throw new Error(`Error while Computing Attributes: ${err.message}`);
  }
}
