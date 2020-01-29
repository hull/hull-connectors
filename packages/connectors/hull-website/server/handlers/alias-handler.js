// @flow

export default (req, res) => {
  const { anonymous_id } = req.body;
  return req.hull
    .alias({ anonymous_id })
    .then(
      ok => res.status(204).send({ ok: !!ok }),
      error => res.status(503).send({ error })
    );
};
