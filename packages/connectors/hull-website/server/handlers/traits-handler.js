// @flow

export default (req, res) => {
  const { name, operation, value } = req.body;
  return req.hull
    .traits({ [name]: { operation, value } }, req.firehoseEventContext)
    .then(
      ok => res.status(204).send({ ok: !!ok }),
      error => res.status(503).send({ error })
    );
};
