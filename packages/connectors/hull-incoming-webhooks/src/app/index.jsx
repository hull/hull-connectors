// @flow

import React, { Component } from "react";

import Nav from "react-bootstrap/Nav";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";

import _ from "lodash";

import {
  Code,
  Preview,
  KeyBindings,
  PayloadSelector,
  ConfigurationModal,
  Area,
  Header,
  CodeTitle,
  Spinner
} from "hull-vm/client/ui";
import type { EngineState, Entry, Result } from "hull-vm";
import type Engine from "./engine";

type Props = {
  engine: Engine
};

type State = EngineState & {
  showConfig: boolean,
  showBindings: boolean,
  activeTab: string,
  result?: Result
};

const DEFAULT_STATE = {
  showConfig: false,
  showBindings: false,
  activeTab: "Current"
};

export default class App extends Component<Props, State> {
  state = {
    ...DEFAULT_STATE,
    // eslint-disable-next-line react/destructuring-assignment
    ...this.props.engine.getState()
  };

  componentWillMount() {
    const { engine } = this.props;
    engine.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    const { engine } = this.props;
    engine.removeChangeListener(this._onChange);
  }

  _onChange = () => {
    const { engine } = this.props;
    this.setState(engine.getState());
  };

  selectEntry = (date: string) => {
    const { engine } = this.props;
    engine.selectEntryByDate(date);
  };

  handleCodeUpdate = (code: string) => {
    const { engine } = this.props;
    engine.updateCode(code);
  };

  handleRefresh = () => {
    const { engine } = this.props;
    engine.fetchRecent();
  };

  hideBindings = () => this.setState({ showBindings: false });

  showBindings = () => this.setState({ showBindings: true });

  hideInstructions = () => this.setState({ showConfig: false });

  showInstructions = () => this.setState({ showConfig: true });

  changeTab = (activeTab: string) => this.setState({ activeTab });

  currentOrPrevious = (current: any, previous: any) => {
    const { activeTab } = this.state;
    return activeTab === "Current" ? current : previous;
  };

  showCurrent = () => this.state.activeTab === "Current";

  renderSetupMessage() {
    const {
      loadingRecent,
      config,
      initialized,
      showConfig,
      recent,
      hostname,
      token
    } = this.state;
    if (!initialized) return null;
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
        {loadingRecent ? (
          <Spinner className="loading-spinner" />
        ) : (
          <span>Attempting fetch</span>
        )}
      </span>
    );
    // const footerMessage = loadingRecent ? (
    //   <Spinner className="loading-spinner" />
    // ) : (
    //   "Attempting fetch in 2s"
    // );
    return (
      config && (
        <ConfigurationModal
          show={showConfig || !hasRecent}
          host={hostname}
          onHide={() => {}}
          connectorId={config.id}
          token={token}
          content={content}
          actions={actions}
          footer={footerMessage}
        />
      )
    );
  }

  render() {
    const {
      selected,
      current,
      loadingRecent,
      recent,
      token,
      hostname,
      // error,
      computing,
      // initialized,
      // result,
      activeTab,
      // showConfig,
      showBindings
    } = this.state;

    const active: Entry | void = this.showCurrent() ? current : selected;

    if (!active || !token || !hostname) {
      return (
        <div className="text-center pt-2">
          <h4>Loading...</h4>
        </div>
      );
    }

    return (
      <div>
        {this.renderSetupMessage()}
        <KeyBindings show={showBindings} onHide={this.hideBindings} />
        <div className="main-container row no-gutters">
          <div className="col vm-column">
            <Header title="Recent webhooks">
              <PayloadSelector
                loading={computing || loadingRecent}
                current={selected}
                recent={recent}
                onSelect={this.selectEntry}
                onRefresh={this.handleRefresh}
              />
              <hr className="payload-divider" />
            </Header>
            <CodeTitle title="Payload" />
            <Area id="code-payload" mode="json" value={active.payload} />
          </div>
          <div className="col vm-column">
            <Header>
              <Nav
                variant="tabs"
                defaultActiveKey="Current"
                activeKey={activeTab}
                justify
                onSelect={this.changeTab}
                className="justify-content-center"
                size="sm"
                id="preview-tabs"
              >
                <Nav.Item>
                  <Nav.Link eventKey="Current">Current Code</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="Previous">At Webhook reception</Nav.Link>
                </Nav.Item>
              </Nav>
            </Header>
            <CodeTitle
              title={`Code ${
                this.showCurrent() ? "(Current)" : "(At webhook reception)"
              }`}
            />
            <Code
              focusOnLoad={true}
              computing={computing}
              code={active.code}
              readOnly={!active.editable}
              onChange={this.handleCodeUpdate}
            />
          </div>
          <div className="col vm-column">
            <Header>
              <ButtonGroup>
                <Button variant="secondary" onClick={this.showInstructions}>
                  Configuration
                </Button>
                <Button variant="secondary" onClick={this.showBindings}>
                  Keyboard Shortcuts
                </Button>
              </ButtonGroup>
            </Header>

            <Preview
              title={activeTab}
              result={active.result}
              computing={computing}
            />
          </div>
        </div>
      </div>
    );
  }
}
