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
} from "./";
import VirtualMachineUI from "./vm-ui";
import type { EngineState, Entry, Result } from "../../types";
import type RecentEngine from "../recent-engine";

type Props = {
  strings: {
    [string]: string
  },
  engine: RecentEngine
};

type State = EngineState & {
  showConfig: boolean,
  activeTab: string
};

const DEFAULT_STATE = {
  showConfig: false,
  activeTab: "Current"
};

export default class RecentEntriesUI extends VirtualMachineUI<Props, State> {
  static leftColumnTitle = "leftColumnTitle";
  static tabCurrent = "tabCurrent";
  static tabPrevious = "tabPrevious";
  state = {
    ...DEFAULT_STATE,
    // eslint-disable-next-line react/destructuring-assignment
    ...this.props.engine.getState()
  };

  constructor(props) {
    super(props);
  }

  hideInstructions = () => this.setState({ showConfig: false });
  showInstructions = () => this.setState({ showConfig: true });

  changeTab = (activeTab: string) => this.setState({ activeTab });
  selectEntry = (date: string) => {
    const { engine } = this.props;
    engine.selectEntryByDate(date);
  };
  handleRefresh = () => {
    const { engine } = this.props;
    engine.fetchRecent();
  };
  currentOrPrevious = (current: any, previous: any) => {
    const { activeTab } = this.state;
    return activeTab === "Current" ? current : previous;
  };

  showingCurrent = () => this.state.activeTab === "Current";

  renderSetupMessage() {
    return null;
  }
  render() {
    const {
      selected,
      current,
      loadingRecent,
      recent,
      url,
      // error,
      computing,
      // initialized,
      // result,
      activeTab,
      // showConfig,
      showBindings
    } = this.state;

    const { strings } = this.props;

    const showingCurrent = this.showingCurrent();
    const active: Entry | void = showingCurrent ? current : selected;

    if (!active || !url) {
      return (
        <div className="text-center pt-2">
          <h4>Loading...</h4>
        </div>
      );
    }
    debugger;

    return (
      <div>
        {this.renderSetupMessage()}
        <KeyBindings show={showBindings} onHide={this.hideBindings} />
        <div className="main-container row no-gutters">
          <div className="col vm-column">
            <Header title={strings.leftColumnTitle}>
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
                  <Nav.Link eventKey="Current">{strings.centerColumnCurrentTab}</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="Previous">{strings.centerColumnPreviousTab}</Nav.Link>
                </Nav.Item>
              </Nav>
            </Header>
            <CodeTitle
              title={`Code ${
                showingCurrent ? "(Current)" : `(${strings.centerColumnPreviousTab})`
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
                {computing ? <Spinner className="loading-spinner" /> : null}
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
