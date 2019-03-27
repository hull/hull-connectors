// @flow
import React from "react";
import _ from "lodash";
import CodeEditor from "../ui/ace";

type Props = {
  onChange: string => void,
  readOnly: boolean,
  code: string
};

const Code = ({ readOnly, onChange, code }: Props) => (
  <CodeEditor
    id="code-editor"
    value={code}
    mode="javascript"
    readOnly={readOnly || !_.isFunction(onChange)}
    onChange={readOnly ? undefined : onChange}
  />
);

export default Code;
