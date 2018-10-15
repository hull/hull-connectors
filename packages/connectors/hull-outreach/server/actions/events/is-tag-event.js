// @flow
const _ = require("lodash");

function isTagEvent(ctx: Object, intercomEvent: Object): boolean {
  const { segments } = ctx;
  const { tagMapping } = ctx.service.syncAgent;
  if (
    _.includes(["user.tag.created", "user.tag.deleted"], intercomEvent.topic) &&
    (_.includes(tagMapping.getTagIds(), intercomEvent.data.item.tag.id) ||
      _.includes(segments.map(s => s.name), intercomEvent.data.item.tag.name))
  ) {
    return true;
  }
  return false;
}

module.exports = isTagEvent;
