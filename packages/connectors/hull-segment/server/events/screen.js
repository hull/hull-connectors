import track from "./track";

export default function handleScreen(payload = {}, context = {}) {
  const { ship = {} } = context;
  const { handle_screens } = ship.settings || {};
  if (handle_screens === false) { return false; }

  const { properties } = payload;
  if (!properties.name && payload.name) {
    properties.name = payload.name;
  }


  const screen = {
    ...payload,
    properties,
    event: "screen",
    active: true
  };

  return track(screen, context)
  .then(() => {
    context.hull.asUser(payload).logger.debug("incoming.screen.success");
  }, (error) => {
    context.hull.asUser(payload).logger.error("incoming.screen.error", { errors: error });
  });
}
