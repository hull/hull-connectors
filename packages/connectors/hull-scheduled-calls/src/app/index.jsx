// @flow

import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import { ConfigurationModal, Spinner, RecentEntriesUI } from "hull-vm/src/ui";
import _ from "lodash";

import type { EngineState } from "hull-vm";
import type Engine from "./engine";

type Props = {
  engine: Engine
};

type State = EngineState & {};

export default class App extends RecentEntriesUI<Props, State> {
  callNow() {}

  callNowAndExecute() {}

  renderSetupMessage() {
    const { initializing, showConfig, recent, url } = this.state;
    const hasRecent = !!_.get(recent, "length", 0);
    const content = hasRecent
      ? "Hull will call the API below on a regular schedule. Call it now manually by clicking the button below"
      : "We haven't called the API Yet. Call it now manually by clicking the button below";
    const actions = [
      <Button key="callNow" onClick={this.callNow}>
        Call API Now
      </Button>,
      <Button key="callNowAndExecute" onClick={this.callNowAndExecute}>
        Call API and Execute code
      </Button>
    ];

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
          <span>Attempting call</span>
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
