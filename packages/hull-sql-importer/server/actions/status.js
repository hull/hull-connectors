/* @flow */
import _ from "lodash";
import type { HullContext, HullStatusResponse } from "hull";
import SyncAgent from "../lib/sync-agent";

const statusHierarchy = ["ok", "warning", "error", "setupRequired"];
function compareStatus(status1: string, status2: string) {
  if (status1 === status2) return 0;

  if (statusHierarchy.indexOf(status1) < statusHierarchy.indexOf(status2)) {
    return -1;
  }
  return 1;
}

const getTestQuery = (db_type) => {
  if (db_type === "salesforce") {
    return "select lastmodifieddate from contact";
  }
  return "SELECT 1 as test";
}

const statusCheckAction = adapter => {
  return async (ctx: HullContext): HullStatusResponse => {
    const { client = {}, connector = {} } = ctx;
    const { private_settings = {} } = connector;
    const { db_type } = private_settings;
    const agent = new SyncAgent(ctx, adapter);

    const status = "ok";
    const messages = [];

    const pushMessage = (
      pendingStatus: "error" | "warning" | "ok" | "setupRequired",
      message: string
    ) => {
      const existingMessage = _.find(messages, { message });
      if (!existingMessage) {
        messages.push({ pendingStatus, message });
      }
    };
    const promises = [];
    client.logger.debug("connector.statusCheck.start");

    if (!agent.areConnectionParametersConfigured()) {
      pushMessage(
        "setupRequired",
        "Connection parameters are not fully configured"
      );
    } else {
      const testQuery = getTestQuery(db_type);
      promises.push(
        agent.runQuery(testQuery, { timeout: 3000 }).catch(err => {
          pushMessage(
            "error",
            `Error when trying to connect with database. ${_.get(
              err,
              "message",
              ""
            )}`
          );
        })
      );
    }

    if (!agent.isQueryStringConfigured()) {
      let changeStatusTo = "ok";
      if (status === "error") {
        changeStatusTo = "error";
      }
      pushMessage(changeStatusTo, "Query is not configured");
    }

    if (!agent.isEnabled()) {
      let changeStatusTo = "ok";
      if (status === "error") {
        changeStatusTo = "error";
      }
      pushMessage(changeStatusTo, "Sync is disabled. Enable it in settings.");
    }

    if (
      _.get(private_settings, "enabled") &&
      _.get(private_settings, "import_days", 0) < 0 &&
      _.includes(_.get(private_settings, "query"), "import_start_date")
    ) {
      let changeStatusTo = "ok";
      if (status === "error") {
        changeStatusTo = "error";
      }
      pushMessage(
        changeStatusTo,
        "Interval syncing is enabled but interval time is less or equal zero."
      );
    }

    await Promise.all(promises);
    let worstStatus = "ok";
    let messagesToSend = [];
    _.forEach(messages, message => {
      const statusComparison = compareStatus(worstStatus, message.status);
      if (statusComparison === 0) {
        messagesToSend.push(message.message);
      } else if (statusComparison < 0) {
        messagesToSend = [message.message];
        worstStatus = message.status;
      }
    });

    return { status: worstStatus, messages: messagesToSend };
  };
};

export default statusCheckAction;
