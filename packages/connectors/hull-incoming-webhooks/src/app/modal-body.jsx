// @flow
/* eslint-disable jsx-a11y/accessible-emoji */

import { Component } from "react";

type Props = {
  url: string
};

export default class ModalBody extends Component<Props> {
  autoSelect = (e: any) => {
    e.target.focus();
    e.target.select();
  };

  render() {
    const { url } = this.props;
    return (
      <textarea
        type="text"
        onClick={this.autoSelect}
        className="form-control input-monospace credential"
        value={url}
        readOnly
        data-autoselect=""
      />
    );
  }
}
