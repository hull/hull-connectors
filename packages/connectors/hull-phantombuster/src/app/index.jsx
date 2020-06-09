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

const renderTitle = ({ hasRecent, sync_interval, api_key }) => {
  if (!api_key)
    return (
      <p>
        Please configure the Phantombuster connector in the Settings tab first
      </p>
    );
  if (hasRecent)
    return (
      <>
        Hull calls the Phantom below every {sync_interval} minutes.
        <br />
        Call it now manually by clicking the button below.
      </>
    );
  return (
    <p>
      We haven't called the Phantom Yet. Call it now manually by clicking the
      button below
    </p>
  );
};

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
      initializing,
      initialized,
      showConfig,
      recent,
      id,
      api_key,
      agent,
      sync_interval
    } = this.state;
    if (!initialized) return null;
    const { strings } = this.props;
    const hasRecent = !!_.get(recent, "length", 0);
    const content = (
      <h5 style={{ textAlign: "center", marginTop: "1rem" }}>
        {renderTitle({ hasRecent, sync_interval, agent, api_key })}
      </h5>
    );
    const actions = [
      computing && <Spinner key="computing" className="loading-spinner" />,
      api_key && (
        <Button size="sm" key="callNow" onClick={this.callNow}>
          Preview Results
        </Button>
      ),
      api_key && (
        <Button size="sm" key="callAndExecute" onClick={this.callNowAndExecute}>
          Start Import Job
        </Button>
      )
    ];

    return (
      <ConfigurationModal
        title={strings.modalTitle}
        body={
          <ModalBody
            id={id}
            api_key={api_key}
            sync_interval={sync_interval}
            agent={agent}
          />
        }
        content={content}
        actions={actions}
        show={
          !initializing || (initialized && (!agent || showConfig || !hasRecent))
        }
        onHide={this.hideInstructions}
      />
    );
  }
}
