// @flow

import _ from "lodash";
import type { HullClient, HullUser } from "hull";

export default async function fetchUser(client: HullClient) {
  try {
    console.log("Calling FetchUser");
    const user: HullUser = await client.get("/me/user_report");
    if (!user || !user.id) {
      client.logger.info("outgoing.user.error", { message: "Not found" });
      throw new Error("No user found");
    }
    client.logger.info("outgoing.user.success", { user });
    const { account, segments } = user;
    return {
      user: _.omit(user, "account", "segments"),
      segments,
      account
    };
  } catch (err) {
    client.logger.info("outgoing.user.error", { error: err });
    throw err;
  }
}
