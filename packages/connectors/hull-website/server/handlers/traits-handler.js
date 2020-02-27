// @flow

const EMAIL_REGEXP = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i

export default (req, res) => {
  const { name, operation, value } = req.body;
  const anonymous_id = req.get("hull-bid") || req.cookies._bid;

  if (name === "email" && EMAIL_REGEXP.test(value)) {
    req.hull = req.hull.asUser({ email: value, anonymous_id });
  }

  return req.hull
    .traits({ [name]: { operation, value } }, req.firehoseEventContext)
    .then(
      ok => res.status(204).send({ ok: !!ok }),
      error => res.status(503).send({ error })
    );
};
