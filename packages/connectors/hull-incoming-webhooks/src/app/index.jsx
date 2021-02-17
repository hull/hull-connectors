// @flow

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
    if (!initialized) return null;
    const { strings } = this.props;
    const hasRecent = !!_.get(recent, "length", 0);
    const content = hasRecent ? (
      <p>
        Copy the URL below and configure your external service to send a valid
        JSON-formatted payload to it as a HTTP POST call
      </p>
    ) : (
      <p>
        We haven&apos;t received data from the outside yet. Copy the URL below
        and configure your external service to POST a valid JSON-formatted
        payload to it.
      </p>
    );
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
