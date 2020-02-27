// @flow

export default (req, res) => {
  const { event, properties } = req.body;
  return req.hull
    .track(event, properties, req.firehoseEventContext)
    .then(
      ok => res.status(204).send({ ok: !!ok }),
      error => res.status(503).send({ error })
    );
};
