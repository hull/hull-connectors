// @flow

import React, { Fragment, Component } from "react";

type Props = {
  source?: string,
  onChange: string => any
};

type State = {};

const hasInvalidCharacters = (value?: string): Array<string> =>
  (value && value.match(/[^0-9A-Za-z-_]/g)) || [];

class Source extends Component<Props, State> {
  handleChange = (e: SyntheticEvent<>) => {
    // $FlowFixMe
    const value: string = e.currentTarget.value;
    this.props.onChange(value);
  };

  render() {
    const { source } = this.props;
    const invalidChars = hasInvalidCharacters(source);
    return (
      <Fragment>
        <div className="flex-row">
          <h4>Import Group : </h4>
          <input
            style={{ width: "100%" }}
            type="text"
            id="source"
            value={source}
            onChange={this.handleChange}
          />
        </div>
        {!invalidChars.length && source ? (
          <p>
            Attributes will be imported under the group &quot;{source}/&quot;
          </p>
        ) : (
          <p>
            Attributes will be imported at the Top level. This is discouraged,
            You should import attributes in a group
          </p>
        )}
        {!!invalidChars.length && (
          <div className="error">
            Invalid Characters, please fix:{" "}
            {invalidChars.map((c, i) => (
              <span key={i}>{c.replace(" ", "Space Character")}</span>
            ))}
          </div>
        )}
      </Fragment>
    );
  }
}

export default Source;
