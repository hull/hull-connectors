// @noflow
// import _ from "lodash";
import Liquid from "liquidjs";
import buildAttachments from "./build-attachments";
import { getUserName, getAccountName } from "./get-name";

const debug = require("debug")("hull-slack:get-notification");

function urlFor(user = {}, entity = "user", organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/${entity}s/${user.id}`;
}

const interpolateText = async (text, message) => {
  const engine = new Liquid();
  const msg = await engine.parseAndRender(text, message);
  return msg;
};

module.exports = async function getNotification({
  client,
  message,
  text,
  attachements,
  entity = "user"
  // , actions = []
}) {
  const { user, account } = message;
  const prefix =
    entity === "user" ? ":bust_in_silhouette:" : ":classical_building:";
  const accountString = getAccountName(account);
  const name =
    entity === "user"
      ? `${getUserName(user)} (${accountString})`
      : accountString;
  debug("building payload for", message);
  const slackText = [
    `${prefix} *<${urlFor(
      user,
      entity,
      client.configuration().organization
    )}|${name}>*`
  ];
  if (text) {
    const msg = await interpolateText(text, message);
    slackText.push(msg);
  }
  return {
    attachments: [
      ...buildAttachments({ user, account, attachements })
      // , getActions(user, actions)
    ],
    text: slackText.join(`
`)
  };
};
