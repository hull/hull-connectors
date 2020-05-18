// @flow
/* eslint-disable jsx-a11y/accessible-emoji, react/no-multi-comp */

import React, { Component } from "react";

type Props = {
  id: string,
  sync_interval: string,
  agent?: {
    name: string,
    nbLaunches: number
  }
};

export default class ModalBody extends Component<Props> {
  autoSelect = (e: any) => {
    e.target.focus();
    e.target.select();
  };

  render() {
    const { sync_interval, agent } = this.props;
    return (
      <div>
        <p>Configure the connector in the Settings tab</p>
        {agent && (
          <h5>
            Phantom ID:
            <code> {agent.name}</code>
          </h5>
        )}
        {sync_interval && (
          <h5>
            Check Interval:
            <code> Every {sync_interval} minutes</code>
          </h5>
        )}
      </div>
    );
  }
}
