// @flow
/* eslint-disable jsx-a11y/accessible-emoji, react/no-multi-comp */

import React, { Component } from "react";

type Props = {
  id: string,
  sync_interval: string
};

export default class ModalBody extends Component<Props> {
  autoSelect = (e: any) => {
    e.target.focus();
    e.target.select();
  };

  render() {
    const { id, sync_interval } = this.props;
    return (
      <div>
        <p>Configure the connector in the Settings tab</p>
        <h5>Phantom ID:</h5>
        <p>{id}</p>
        <h5>Check Interval:</h5>
        <p>every {sync_interval} minutes</p>
      </div>
    );
  }
}
