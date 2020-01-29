// @flow

export default (req, res) => {
  const { url, referer, event, properties } = req.body;
  const context = {
    _sid: req.cookies._sid,
    url,
    referer,
    ip: req.get("x-real-ip"),
    useragent: req.get("user-agent"),
    created_at: Date.now()
  };
  return req.hull
    .track(event, properties, context)
    .then(
      ok => res.status(204).send({ ok: !!ok }),
      error => res.status(503).send({ error })
    );
};
