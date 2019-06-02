// @flow
import React, { Fragment } from "react";
import _ from "lodash";
import fp from "lodash/fp";

import Area from "./area";
import CodeTitle from "./code-title";
import type { Result } from "../../types";

const nice = (obj = {}) => JSON.stringify(obj, null, 2);
const short = (obj = {}) => JSON.stringify(obj);
// const conditional = (data, text) => {
//   if (!data || !_.size(data)) return "";
//   return `/* ${text} */ ${_.isObject(data) ? nice(data) : data}`;
// };
const joinLines = fp.join("\n");

const renderClaimsOptions = (options = {}) =>
  _.size(options) ? `,${short(options)}` : "";

const renderUserClaim = ({ claims, claimsOptions }) =>
  `hull
.asUser(${short(claims)}${renderClaimsOptions(claimsOptions)})`;

const renderAccountClaim = ({ claims, claimsOptions }) =>
  `hull
.asAccount(${short(claims)}${renderClaimsOptions(claimsOptions)})`;

const renderTraits = claimRender => ({
  claims,
  traits: { attributes, context },
  claimsOptions
}) => `${claimRender({ claims, claimsOptions })}
.traits(${nice(attributes)}, ${nice(context)});`;

const renderUserTraits = renderTraits(renderUserClaim);
const renderAccountTraits = renderTraits(renderAccountClaim);

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
    ({ claims, accountClaims }) => `/* User */ ${short(claims)}
/* -> Account */ ${short(accountClaims)}
`
  ),
  joinLines
);

const renderEventBody = ({ eventName, context, properties }) =>
  `"${eventName}", ${nice(properties)}, ${nice(context)}`;

const renderEvent = ({
  event,
  claims,
  claimsOptions
}) => `// <--------- Event --------->
${renderUserClaim({ claims, claimsOptions })}
.track(${renderEventBody(event)});`;

const mapEvents = fp.flow(
  fp.map(renderEvent),
  joinLines
);

type Props = {
  result?: Result
};

const Preview = ({ result }: Props) => {
  if (!result)
    return (
      <Fragment>
        <CodeTitle title="Console" />
        <Area
          id="code-console"
          value="//Nothing to display. Type some code to preview results"
          mode="javascript"
        />
      </Fragment>
    );

  const {
    userTraits = [],
    accountTraits = [],
    accountLinks = [],
    errors = [],
    events = [],
    logs = []
  } = result;

  const hasErrors = _.size(errors);

  const output = {
    "User Attributes": mapTraits(renderUserTraits)(userTraits),
    "Account Attributes": mapTraits(renderAccountTraits)(accountTraits),
    "User-Account Links": mapAccountLinks(accountLinks),
    "User Events": mapEvents(events)
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
          <Area id={`code-${k}`} value={v} type="info" mode="javascript" />
        </Fragment>
      ))}
      <CodeTitle title="Console" />
      <Area id="code-console" value={renderLogs(logs)} mode="javascript" />
    </Fragment>
  );
};
export default Preview;
