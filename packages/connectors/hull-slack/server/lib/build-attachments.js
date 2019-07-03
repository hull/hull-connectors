// @noflow
import _ from "lodash";

// const MOMENT_FORMAT = "MMMM Do YYYY, h:mm:ss a";

function colorFactory() {
  const COLORS = ["#83D586", "#49A2E1", "#FF625A", "#E57831", "#4BC2B8"];
  let i = -1;
  const l = COLORS.length;
  return function cycle() {
    i += 1;
    return COLORS[i % l];
  };
}

function getBlockAttachements(user, account, attachements, color) {
  const payload = { ...user, account };
  return _.map(attachements, ({ block_title, attributes }) => ({
    color: color(),
    author_name: block_title,
    mrkdwn_in: ["text"],
    text: _.map(
      attributes,
      title =>
        `*${title.replace(/^traits_/, "")}*: ${_.get(
          payload,
          title,
          "_Undefined_"
        )}`
    ).join("\n")
    // fields: _.map(attributes, title => ({
    //   title: title.replace(/^traits_/, ""),
    //   value: _.get(payload, title, "Undefined"),
    //   short: false
    // }))
  }));
}

module.exports = function buildAttachments({
  user = {},
  account = {},
  attachements = []
}) {
  const color = colorFactory();
  return getBlockAttachements(user, account, attachements, color).filter(
    ({ text, fields = [] }) => text || fields.length
  );
};
