// @flow
import React, { Fragment } from "react";
import _ from "lodash";
import Area from "./area";
import CodeTitle from "./code-title";
import type { ResultBase } from "../../types";

type Props = {
  result?: ResultBase,
  errors: Array<string>,
  url: string,
  headers: {}
};

const Preview = ({ result = {}, errors = [] }: Props) => {
  const { data = {}, traits = {} } = result;

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
      <CodeTitle title="Payload Preview" />
      <Area
        aceOptions={{
          wrapMethod: "text",
          wrapEnabled: true
        }}
        id="code-console"
        value={data}
        mode="json"
      />
      <CodeTitle title="Computed Attribute Changes Preview" />
      <Area
        aceOptions={{
          wrapMethod: "text",
          wrapEnabled: true
        }}
        id="code-console"
        value={traits}
        mode="json"
      />
    </Fragment>
  );
};
export default Preview;
