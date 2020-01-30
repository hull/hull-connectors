// @flow

import React from "react";

import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import { ConfigurationModal, Spinner, RecentEntriesUI } from "hull-vm/src/ui";
import _ from "lodash";

import type { EngineState } from "hull-vm";
import type Engine from "./engine";
import ModalBody from "./modal-body";

type Props = {
  engine: Engine
};

type State = EngineState & {};

export default class App extends RecentEntriesUI<Props, State> {
  renderSetupMessage() {
    const { initializing, initialized, showConfig, recent, url } = this.state;
    if (!initialized) return;
    const { strings } = this.props;
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
        {initialized ? (
          <span>Attempting fetch</span>
        ) : (
          <Spinner className="loading-spinner" />
        )}
      </span>
    );

    return (
      <ConfigurationModal
        title={strings.modalTitle}
        content={content}
        body={<ModalBody url={url} />}
        footer={footerMessage}
        actions={actions}
        show={showConfig || !hasRecent}
        onHide={this.hideInstructions}
      />
    );
  }
}
