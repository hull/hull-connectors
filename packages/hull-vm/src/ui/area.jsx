// @flow
import React from "react";
import stringify from "json-stable-stringify";
import CodeEditor from "./ace";

type Props = {
  className?: string,
  mode: string,
  id: string,
  aceOptions?: { [string]: any },
  onChange?: string => void,
  value: string | {} | Array<any>
};

const Area = ({ aceOptions, id, mode, className, onChange, value }: Props) => (
  <CodeEditor
    id={id}
    className={className}
    mode={mode}
    readOnly
    aceOptions={aceOptions}
    value={typeof value !== "string" ? stringify(value, { space: 2 }) : value}
    onChange={onChange}
  />
);
export default Area;
