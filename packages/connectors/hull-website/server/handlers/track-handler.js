// @flow

export default async req => {
  const { event, properties } = req.body;
  return req.hull.track(event, properties, req.firehoseEventContext);
};
