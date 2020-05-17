// @flow

import React from "react";
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
  callNow = () => {
    this.props.engine.callAPI(false);
  };

  callNowAndExecute = () => {
    this.props.engine.callAPI(true);
  };

  renderSetupMessage() {
    const {
      computing,
      initialized,
      showConfig,
      recent,
      id,
      sync_interval
    } = this.state;
    if (!initialized) return null;
    const { strings } = this.props;
    const hasRecent = !!_.get(recent, "length", 0);
    const content = hasRecent
      ? `Hull calls the Phantom below every ${sync_interval} minutes. Call it now manually by clicking the button below`
      : "We haven't called the Phantom Yet. Call it now manually by clicking the button below";
    const actions = [
      computing && <Spinner className="loading-spinner" />,
      <Button size="sm" key="callNow" onClick={this.callNow}>
        Call Phantom (preview results)
      </Button>,
      <Button
        size="sm"
        key="callNowAndExecute"
        variant="danger"
        onClick={this.callNowAndExecute}
      >
        Call Phantom (live call)
      </Button>
    ];

    return (
      <ConfigurationModal
        title={strings.modalTitle}
        body={<ModalBody id={id} sync_interval={sync_interval} />}
        content={content}
        actions={actions}
        show={showConfig || !hasRecent}
        onHide={this.hideInstructions}
      />
    );
  }
}
