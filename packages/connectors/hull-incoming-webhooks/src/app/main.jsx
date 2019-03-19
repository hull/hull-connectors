// @flow
/* eslint no-unused-vars:0, no-useless-constructor:0, import/no-unresolved:0 */
import React, { Component } from "react";
import DropdownButton from "react-bootstrap/DropdownButton";
import Nav from "react-bootstrap/Nav";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";

import _ from "lodash";
import type { EngineState, Ship, Result, Entry } from "../../types";
import type Engine from "./engine";

import KeyBindings from "./ui/key-bindings";
import ConfigurationModal from "./ui/configuration-modal";
import CodePane from "./code";
import Area from "./ui/area";
import Preview from "./preview";
import Header from "./ui/header";
import PayloadSelector from "./ui/payload-selector";
import CodeTitle from "./ui/code-title";
import Spinner from "./ui/spinner";

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

  getCode = () => {
    const { activeTab, code, current = {} } = this.state;
    if (activeTab === "Current") {
      return code;
    }
    return current.code;
  };

  getResults = () => {
    const { result, current = {}, activeTab } = this.state;
    if (activeTab === "Current") {
      return result;
    }
    return current.result;
  };

  renderSetupMessage() {
    const {
      loadingRecent,
      config,
      showConfig,
      recent,
      hostname,
      token
    } = this.state;
    const hasRecent = !!_.get(recent, "length", 0);
    const content = hasRecent
      ? "Copy the URL below and configure your external service to send a valid JSON-formatted payload to it as a HTTP POST call"
      : "We haven't received data from the outside yet. Copy the URL below and configure your external service to POST a valid JSON-formatted payload to it.";
    const actions = hasRecent ? (
      <Button onClick={this.hideInstructions}>Close</Button>
    ) : null;
    const footerMessage = loadingRecent ? (
      <Spinner className="loading-spinner" />
    ) : (
      "Attempting fetch in 2s"
    );
    return (
      config && (
        <ConfigurationModal
          show={showConfig || !hasRecent}
          host={hostname}
          onHide={() => {}}
          connectorId={config.ship}
          token={token}
          content={content}
          actions={actions}
          footer={hasRecent ? null : footerMessage}
        />
      )
    );
  }

  render() {
    const {
      current,
      loadingRecent,
      recent,
      token,
      hostname,
      error,
      computing,
      initialized,
      result,
      activeTab,
      showConfig,
      showBindings
    } = this.state;
    const { payload } = current || {};

    if (!token || !hostname) {
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
        <div className="main-container flexRow">
          <div className="flexColumn flexGrow third">
            <Header title="Recent webhooks">
              <PayloadSelector
                loading={computing || loadingRecent}
                current={current}
                recent={recent}
                onSelect={this.selectEntry}
                onRefresh={this.handleRefresh}
              />
              <hr className="payload-divider" />
            </Header>
            <CodeTitle title="Payload" />
            <Area
              id="code-payload"
              mode="json"
              className="flexGrow"
              value={payload}
            />
          </div>
          <div className="flexColumn flexGrow third">
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
            <CodeTitle title="Code" />
            <CodePane
              computing={computing}
              code={this.getCode()}
              readOnly={activeTab !== "Current"}
              onChange={this.handleCodeUpdate}
            />
          </div>
          <div className="flexColumn flexGrow third">
            <Header>
              <ButtonGroup size="sm">
                <Button
                  variant="outline-secondary"
                  onClick={this.showInstructions}
                >
                  Configuration
                </Button>
                <Button variant="outline-secondary" onClick={this.showBindings}>
                  Keyboard Shortcuts
                </Button>
              </ButtonGroup>
            </Header>

            {result && (
              <Preview
                title={activeTab}
                result={this.getResults()}
                computing={computing}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}
