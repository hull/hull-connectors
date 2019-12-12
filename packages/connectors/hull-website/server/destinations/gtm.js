// @flow
//
export default function({ user, settings }: any) {
  return {
    enabled: settings.use_gtm,
    userID: settings.map_user_id && user[settings.map_user_id]
  };
}
