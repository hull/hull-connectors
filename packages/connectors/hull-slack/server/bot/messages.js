//@noflow
const more = "_Type `@hull help` and I'll show you what I can do_";

module.exports = {
  hi: ":wave: Hullo!",
  notfound: "¯\\_(ツ)_/¯ Not sure I understand what you mean",
  help: `
Ask me about your users, I can show what I know about them and perform actions.
In your dashboard, you can add buttons to user profiles to perform actions.

Chat with me privately in a direct channel or invite me to a public channel!

:keyboard: *Commands*
_\`@hull user@example.com\` : get data for the user with this email. You can filter what's displayed from the Ship's settings tab in your dashboard_
_\`@hull user@example.com full\` : get full data for the user with this email. Shows the entire profile_
_\`@hull info user@example.com\` : get data for the user with this email. You can filter what's displayed from the Ship's settings tab in your dashboard_
_\`@hull info id:EXTERNAL_ID\` : get data for the user with this external ID_
_\`@hull user@example.com <intercom>\` : get \`intercom\` data for the user with this email. Replace with the service you want to display_
_\`@hull events user@example.com\` : get latest events for the user with this email_
`,

  welcome: `
:tada: Hullo! I am the Hull bot and I've just joined your team
_You can /invite me to a channel or talk to me privately_
${more}`,

  join: `
:tada: Hullo everyone! I am the Hull bot and I've just joined this channel.
${more}`,
};

// _\`@hull set user@example.com {"foo":"bar"}\`: set these properties for the User_
