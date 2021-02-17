// @flow

const EMAIL_REGEXP = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

export default async req => {
  let traits = req.body;

  // legacy format sent by hull.js v0.10
  const { name, operation, value } = traits;
  if (name && operation && value) {
    traits =
      operation === "set"
        ? { [name]: value }
        : { [name]: { operation, value } };
  }

  if (traits.email && EMAIL_REGEXP.test(traits.email)) {
    const anonymous_id = req.get("hull-bid") || req.cookies._bid;
    req.hull = req.hull.asUser(
      { email: traits.email, anonymous_id },
      { active: true }
    );
  }

  return req.hull.traits(traits, req.firehoseEventContext);
};
