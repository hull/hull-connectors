// @flow
import React, { Fragment } from "react";
import _ from "lodash";
import fp from "lodash/fp";
import type { HullEntityName } from "hull";
import Area from "./area";
import CodeTitle from "./code-title";
import type { Result } from "../../types";

const nice = obj => {
  if (obj === undefined) return "undefined";
  if (obj === null) return "null";
  return JSON.stringify(obj, null, 2);
};

// const nice = (obj = {}) => JSON.stringify(obj);
// const conditional = (data, text) => {
//   if (!data || !_.size(data)) return "";
//   return `/* ${text} */ ${_.isObject(data) ? nice(data) : data}`;
// };
const joinLines = fp.join("\n");

const renderUserClaim = claims => `hull.asUser(${nice(claims.asUser)})`;
const renderAccountClaim = claims =>
  `hull.asAccount(${nice(claims.asAccount)})`;

const renderShortTraits = ([_claims, attributes]) => `traits(${nice(
  attributes
)});
`;
const renderShortAlias = (operation, aliases) => `${operation}(${nice(
  aliases
)});
`;
const renderTraits = claimRenderer => ([claims, attributes]) =>
  `${claimRenderer(claims)}.${renderShortTraits([claims, attributes])}`;

const renderAlias = claimRenderer => ([claims, alias]) =>
  _.map(
    alias,
    ([aliasClaim, operation]) =>
      `${claimRenderer(claims)}.${renderShortAlias(operation, aliasClaim)}`
  ).join("\n");

const mapTraits = method =>
  fp.flow(
    fp.map(method),
    joinLines
  );

const renderStringOrObject = (i: string | {} | Array<any>) => {
  if (_.isArray(i)) {
    return i.map(nice).join(", ");
  }
  return _.isString(i) ? i : nice(i);
};

const renderLogs = fp.flow(
  fp.map(renderStringOrObject),
  joinLines
);

const mapAccountLinks = fp.flow(
  fp.map(
    ([claims, accountClaims]) => `//★ User → ${nice(claims.asUser)}
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
// const renderScopedEvent = _claims => ({ event }) => `//★ Event →
// track(${renderEventBody(event)});
// `;

const mapEvents = fp.flow(
  // fp.map(claims ? renderScopedEvent(claims) : renderEvent(claims)),
  fp.map(renderEvent),
  joinLines
);

type Props = {
  result?: Result,
  entity?: HullEntityName,
  scoped?: boolean
};

const Preview = ({ result, scoped, entity }: Props) => {
  if (!result)
    return (
      <Fragment>
        <CodeTitle title="Console" />
        <Area
          aceOptions={{
            wrapMethod: "code",
            wrapEnabled: true
          }}
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
    // claims,
    errors = [],
    events = [],
    logs = []
  } = result;

  const hasErrors = _.size(errors);

  const output = {
    "User Attributes": mapTraits(renderTraits(renderUserClaim))(userTraits),
    "Account Attributes": mapTraits(renderTraits(renderAccountClaim))(
      accountTraits
    ),
    "User-Account Links": mapAccountLinks(accountLinks),
    "User Events": mapEvents(events),
    "User Aliases": mapTraits(renderAlias(renderUserClaim))(userAliases),
    "Account Aliases": mapTraits(renderAlias(renderAccountClaim))(
      accountAliases
    )
  };

  return hasErrors ? (
    <Fragment>
      <CodeTitle title="Errors" error />
      <Area
        aceOptions={{
          wrapMethod: "text",
          wrapEnabled: true
        }}
        id="code-error"
        value={errors.join("\n-----\n")}
        mode="text"
      />
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
      <Area
        aceOptions={{
          wrapMethod: "text",
          wrapEnabled: true
        }}
        id="code-console"
        value={renderLogs(logs)}
        mode="javascript"
      />
    </Fragment>
  );
};
export default Preview;
