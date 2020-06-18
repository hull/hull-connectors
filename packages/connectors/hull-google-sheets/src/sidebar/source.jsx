// @flow

import React, { Fragment, Component } from "react";
import Creatable from "react-select/creatable";
import hasInvalidCharacters from "../lib/has-invalid-characters";
import { toOptions } from "../lib/filter-utils";
import Errors from "./errors";

type Props = {
  source: string,
  sources: Array<string>,
  onChange: string => any
};

type State = {};

class Source extends Component<Props, State> {
  handleChange = option =>
    option ? this.props.onChange(option.value) : this.props.onChange();

  renderSourceMessage(source) {
    return source ? (
      <p>Attributes will be imported under the group &quot;{source}/&quot;</p>
    ) : (
      <p>
        Attributes will be imported at the Top level. This is discouraged, You
        should import attributes in a group
      </p>
    );
  }

  render() {
    const { source, sources } = this.props;
    const invalidChars = hasInvalidCharacters(source);
    return (
      <Fragment>
        <h4>Import Group</h4>
        <Creatable
          isClearable
          isSearchable
          className="source-select"
          defaultValue={toOptions(source)}
          options={sources.map(toOptions)}
          onChange={this.handleChange}
        />
        <Errors errors={invalidChars} />
        {!invalidChars.length ? this.renderSourceMessage(source) : null}
      </Fragment>
    );
  }
}

export default Source;
