// @noflow
import _ from "lodash";
import Liquid from "liquidjs";
import buildAttachments from "./build-attachments";
import getUserName from "./get-user-name";

function urlFor(user = {}, organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
}

function cast(v) {
  if (_.isString(v)) {
    // Boolean
    let V = v.toLowerCase();
    if (V === "true" || V === "false") return V === "true";

    // Number
    V = Number(v);
    if (!_.isNaN(V)) return V;
  }
  return v;
}

const interpolateText = async (text, message) => {
  const engine = new Liquid();
  const msg = await engine.parseAndRender(text, message);
  return msg;
};

const getActions = (user, actions) => ({
  title: `Actions for ${user.name || user.email}`,
  fallback: "Can't show message actions",
  attachment_type: "default",
  mrkdwn_in: ["text", "fields", "pretext"],
  callback_id: user.id,
  actions: [
    ..._.map(
      _.filter(
        actions,
        a => a.label !== "" && a.property !== "" && a.value !== "",
        a => {
          return {
            name: "trait",
            value: JSON.stringify({
              [a.property.replace(/^traits_/, "")]: cast(a.value)
            }),
            text: a.label,
            type: "button"
          };
        }
      )
    )
  ]
});

module.exports = async function userPayload({
  hull,
  message,
  text,
  attachements,
  actions = []
}) {
  const { user, account } = message;
  const slackText = [
    `:bust_in_silhouette: *<${urlFor(
      user,
      hull.configuration().organization
    )}|${getUserName(user)}>*`
  ];
  if (text) {
    const msg = await interpolateText(text, message);
    slackText.push(msg);
  }
  return {
    attachments: [
      ...buildAttachments({ user, account, attachements }),
      getActions(user, actions)
    ],
    text: slackText.join(`
——————————————————————————
`)
  };
};
