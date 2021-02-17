// @flow

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
      url,
      headers,
      cookies,
      body,
      format,
      sync_interval,
      method
    } = this.state;
    if (!initialized) return null;
    const { strings } = this.props;
    const hasRecent = !!_.get(recent, "length", 0);
    const content = hasRecent ? (
      <p>
        Hull calls the API below every {sync_interval} minutes.
        <br />
        Call it now manually by clicking the button below
      </p>
    ) : (
      <p>
        We haven&apos;t called the API Yet. Call it now manually by clicking the
        button below
      </p>
    );
    const actions = [
      computing && <Spinner className="loading-spinner" />,
      <Button size="sm" key="callNow" onClick={this.callNow}>
        Call API (preview results)
      </Button>,
      <Button
        size="sm"
        key="callNowAndExecute"
        variant="danger"
        onClick={this.callNowAndExecute}
      >
        Call API (live call)
      </Button>
    ];

    return (
      <ConfigurationModal
        title={strings.modalTitle}
        body={
          <ModalBody
            url={url}
            headers={headers}
            method={method}
            cookies={cookies}
            body={body}
            format={format}
            sync_interval={sync_interval}
          />
        }
        content={content}
        actions={actions}
        show={showConfig || !hasRecent}
        onHide={this.hideInstructions}
      />
    );
  }
}
