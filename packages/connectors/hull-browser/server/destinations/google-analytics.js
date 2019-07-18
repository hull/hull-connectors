export default function({ user, settings }) {
  const payload = {};
  if (settings.map_user_id) {
    payload.userId = user[settings.map_user_id];
  }
  return payload;
}
