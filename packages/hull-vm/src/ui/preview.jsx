// @flow
import React, { Fragment } from "react";
import _ from "lodash";
import fp from "lodash/fp";
import Area from "./area";
import CodeTitle from "./code-title";
import type { Result } from "../../types";

const nice = (obj = {}) => JSON.stringify(obj, null, 2);
// const nice = (obj = {}) => JSON.stringify(obj);
// const conditional = (data, text) => {
//   if (!data || !_.size(data)) return "";
//   return `/* ${text} */ ${_.isObject(data) ? nice(data) : data}`;
// };
const joinLines = fp.join("\n");

const renderUserClaim = claims => `hull.asUser(${nice(claims)})`;
const renderAccountClaim = claims => `hull.asAccount(${nice(claims)})`;

const renderShortTraits = ([claims, attributes]) => `traits(${nice(
  attributes
)});
`;
const renderShortAlias = (operation, aliases) => `${operation}(${nice(
  aliases
)});
`;
const renderTraits = (claimRender, scoped) => ([claims, attributes]) =>
  (scoped ? "" : `${claimRender(claims)}.`) +
  renderShortTraits([claims, attributes]);
const renderAlias = (claimRender, scoped) => ([claims, alias]) =>
  _.map(
    alias,
    ([aliasClaim, operation]) =>
      (scoped ? "" : `${claimRender(claims)}.`) +
      renderShortAlias(operation, aliasClaim)
  ).join("\n");

const mapTraits = method =>
  fp.flow(
    fp.map(method),
    joinLines
  );

const renderStringOrObject = (i: string | {} | Array<any>) =>
  _.isString(i) ? i : nice(i);

const renderLogs = fp.flow(
  fp.map(renderStringOrObject),
  joinLines
);

const mapAccountLinks = fp.flow(
  fp.map(
    ([claims, accountClaims]) => `//★ User → ${nice(claims)}
//★ Account → ${nice(accountClaims)}

`
  ),
  joinLines
);

const renderEventBody = ({ eventName, context, properties }) =>
  `"${eventName}", ${nice(properties)}, ${nice(context)}`;

const renderEvent = ({ event, claims }) => `//★ Event →
${renderUserClaim(claims)}
.track(${renderEventBody(event)});
`;
const renderScopedEvent = ({ event }) => `//★ Event →
track(${renderEventBody(event)});
`;

const mapEvents = scoped =>
  fp.flow(
    fp.map(scoped ? renderScopedEvent : renderEvent),
    joinLines
  );

type Props = {
  result?: Result,
  scoped?: boolean
};

const Preview = ({ result, scoped }: Props) => {
  if (!result)
    return (
      <Fragment>
        <CodeTitle title="Console" />
        <Area
          id="code-console"
          value="// Nothing to display. Type some code to preview results"
          mode="javascript"
        />
      </Fragment>
    );

  const {
    userTraits = [],
    accountTraits = [],
    accountLinks = [],
    accountAliases = [],
    userAliases = [],
    errors = [],
    events = [],
    logs = []
  } = result;

  const hasErrors = _.size(errors);

  const output = {
    "User Attributes": mapTraits(renderTraits(renderUserClaim, false))(
      userTraits
    ),
    "Account Attributes": mapTraits(renderTraits(renderAccountClaim, false))(
      accountTraits
    ),
    "User-Account Links": mapAccountLinks(accountLinks),
    "User Events": mapEvents(false)(events),
    "User Aliases": mapTraits(renderAlias(renderUserClaim, false))(userAliases),
    "Account Aliases": mapTraits(renderAlias(renderAccountClaim, false))(
      accountAliases
    )
  };

  return hasErrors ? (
    <Fragment>
      <CodeTitle title="Errors" error />
      <Area id="code-error" value={errors.join("\n-----\n")} mode="text" />
    </Fragment>
  ) : (
    <Fragment>
      {_.map(_.pickBy(output, v => !!v), (v, k) => (
        <Fragment key={k}>
          <CodeTitle title={k} />
          <Area
            id={`code-${k}`}
            value={v}
            type="info"
            mode={k === "User-Account Links" ? "text" : "javascript"}
          />
        </Fragment>
      ))}
      <CodeTitle title="Console" />
      <Area id="code-console" value={renderLogs(logs)} mode="javascript" />
    </Fragment>
  );
};
export default Preview;
