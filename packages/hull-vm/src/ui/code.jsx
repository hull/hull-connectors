// @flow
import React from "react";
import _ from "lodash";
import CodeEditor from "./ace";

type Props = {
  onChange: string => void,
  readOnly: boolean,
  code: string,
  mode?: string,
  focusOnLoad: boolean
};

const Code = ({
  mode = "javascript",
  focusOnLoad,
  readOnly,
  onChange,
  code
}: Props) => (
  <CodeEditor
    focusOnLoad={focusOnLoad}
    id="code-editor"
    value={code}
    mode={mode}
    readOnly={readOnly || !_.isFunction(onChange)}
    onChange={readOnly ? undefined : onChange}
  />
);

export default Code;
