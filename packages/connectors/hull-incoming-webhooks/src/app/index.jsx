// @flow

import React, { Component } from "react";

import Nav from "react-bootstrap/Nav";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import { ConfigurationModal, Spinner, RecentEntriesUI } from "hull-vm/src/ui";
import _ from "lodash";

import type { EngineState, Entry, Result } from "hull-vm";
import type Engine from "./engine";

type Props = {
  engine: Engine
};

type State = EngineState & {};

const DEFAULT_STATE = {};
export default class App extends RecentEntriesUI<Props, State> {
  constructor(props: any) {
    super(props);
  }

  renderSetupMessage() {
    const {
      initializing,
      initialized,
      showConfig,
      recent,
      url
    } = this.state;
    const hasRecent = !!_.get(recent, "length", 0);
    const content = hasRecent
      ? "Copy the URL below and configure your external service to send a valid JSON-formatted payload to it as a HTTP POST call"
      : "We haven't received data from the outside yet. Copy the URL below and configure your external service to POST a valid JSON-formatted payload to it.";
    const actions = hasRecent && (
      <Button onClick={this.hideInstructions}>Close</Button>
    );

    const footerMessage = !hasRecent && (
      <span
        style={{
          height: 24,
          flexDirection: "row",
          display: "flex",
          alignItems: "center"
        }}
      >
        {initializing ? (
          <Spinner className="loading-spinner" />
        ) : (
          <span>Attempting fetch</span>
        )}
      </span>
    );

    return (
      <ConfigurationModal
        show={showConfig || !hasRecent}
        url={url}
        onHide={() => {}}
        content={content}
        actions={actions}
        footer={footerMessage}
      />
    );
  }
}
