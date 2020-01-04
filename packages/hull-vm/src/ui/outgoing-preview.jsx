// @flow
import React, { Fragment } from "react";
import _ from "lodash";
import fp from "lodash/fp";
import type { HullEntityName } from "hull";
import Area from "./area";
import CodeTitle from "./code-title";
import type { ResultBase } from "../../types";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";

const nice = obj => {
  if (obj === undefined) return "undefined";
  if (obj === null) return "null";
  return JSON.stringify(obj, null, 2);
};

const joinLines = fp.join("\n");

const renderStringOrObject = (i: string | {} | Array<any>) =>
  _.isArray(i) ? i.map(nice).join(", ") : _.isString(i) ? i : nice(i);

const renderLogs = fp.flow(
  fp.map(renderStringOrObject),
  joinLines
);

type Props = {
  result?: ResultBase,
  url: string,
  headers: {}
};

const Preview = ({ result = {}, url, headers }: Props) => {
  const { data = {}, errors = [], logs = [] } = result;

  const hasErrors = _.size(errors);

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
      <CodeTitle title="URL (Update in Settings tab)" />
      <ListGroup>
        <ListGroup.Item>
          {url ? (
            <Fragment>
              <Badge variant="success">POST</Badge>  <code>{url}</code>
            </Fragment>
          ) : (
            "Go to the Settings tab to enter a destination URL"
          )}
        </ListGroup.Item>
      </ListGroup>
      <CodeTitle title="Headers (Update in Settings tab)" />
      <ListGroup>
        {_.map(headers, (v, k) => (
          <ListGroup.Item key={k}>
            <code>
              {k}: {v}
            </code>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <CodeTitle title="Body" />
      <Area
        aceOptions={{
          wrapMethod: "text",
          wrapEnabled: true
        }}
        id="code-console"
        value={data}
        mode="json"
      />
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
