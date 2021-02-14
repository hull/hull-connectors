import track from "./track";

export default function handlePage(payload = {}, context = {}) {
  const { ship = {} } = context;
  const { handle_pages } = ship.settings || {};
  if (handle_pages === false) { return false; }

  const { properties = {} } = payload;
  if (!properties.name && payload.name) {
    properties.name = payload.name;
  }


  const page = {
    ...payload,
    properties,
    event: "page",
    active: true
  };

  return track(page, context);
}
