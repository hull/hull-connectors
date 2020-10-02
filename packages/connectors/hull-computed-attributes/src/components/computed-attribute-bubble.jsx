// @flow

import React, { Component } from "react";

type Props = {
  id: string,
  type: string
};

type State = EngineState;

export default class ComputedAttributeBubble extends Component<Props, State> {
  render() {
    const { id, children } = this.props;
    return (
      <div className="ca_bubble">
        <div className="ca_bubble__container">{children}</div>
      </div>
    );
  }
}
