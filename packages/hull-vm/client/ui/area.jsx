// @flow
import React from "react";
import stringify from "json-stable-stringify";
import CodeEditor from "./ace";

type Props = {
  className?: string,
  mode: string,
  id: string,
  onChange?: string => void,
  value: string | {} | Array<any>
};

const Area = ({ id, mode, className, onChange, value }: Props) => (
  <CodeEditor
    id={id}
    className={className}
    mode={mode}
    readOnly
    value={typeof value !== "string" ? stringify(value, { space: 2 }) : value}
    onChange={onChange}
  />
);

//
// class Area extends Component<Props> {
//   render() {
//     const { className, wrap, style, onChange, value, javascript } = this.props;
//
//     return (
//     );
//   }
// }
//
export default Area;
