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
        {agent && (
          <p>
            Phantom ID: <code> {agent.name}</code>
          </p>
        )}
        {agent && sync_interval && (
          <p>
            Check Interval:
            <code> Every {sync_interval} minutes</code>
          </p>
        )}
      </div>
    );
  }
}
