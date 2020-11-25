// @flow
export default function ga({ user, settings }: any) {
  return {
    enabled: settings.use_ga,
    userID: settings.map_user_id && user[settings.map_user_id]
  };
}
