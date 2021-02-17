// @flow

export default async req => {
  const { anonymous_id } = req.body;
  return req.hull.alias({ anonymous_id }, req.firehoseEventContext);
};
