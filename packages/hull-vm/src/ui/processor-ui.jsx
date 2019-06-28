// @flow

import React, { Component } from "react";

import Nav from "react-bootstrap/Nav";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";

import _ from "lodash";

import Code from "./code";
import Preview from "./preview";
import KeyBindings from "./key-bindings";
import EntrySelector from "./entry-selector";
import EventSelector from "./event-selector";
import ConfigurationModal from "./configuration-modal";
import Area from "./area";
import Header from "./header";
import CodeTitle from "./code-title";
import Spinner from "./spinner";

import VirtualMachineUI from "./vm-ui";
import type { EngineState, Entry, Result } from "../../types";
import type ProcessorEngine from "../processor-engine";

type Props = {
  strings: {
    [string]: string
  },
  engine: ProcessorEngine
};

type State = EngineState;

const DEFAULT_STATE = {
  showConfig: false,
  activeTab: "Current"
};

export default class ProcessorUI extends VirtualMachineUI<Props, State> {
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

  handleUpdateQuery = (e) => {
    const query = e.target.value;
    const { engine } = this.props;
    engine.updateQuery(query);
  };

  render() {
    const {
      current,
      initializing,
      recent,
      computing,
      showBindings
    } = this.state;

    const { strings } = this.props;

    if (!current) {
      return (
        <div className="text-center pt-2">
          <h4>Loading...</h4>
        </div>
      );
    }

    return (
      <div>
        <KeyBindings show={showBindings} onHide={this.hideBindings} />
        <div className="main-container row no-gutters">
          <div className="col vm-column">
            <Header title={strings.leftColumnTitle}>
              <EntrySelector
                loading={computing || initializing}
                current={current}
                recent={recent}
                onChange={this.handleUpdateQuery}
              />
              <hr className="payload-divider" />
            </Header>
            <CodeTitle title="Payload" />
            <Area id="code-payload" mode="json" value={current.payload} />
          </div>
          <div className="col vm-column">
            <Header title="Pick sample Events">
              <EventSelector
                loading={computing || initializing}
                onChange={this.handleUpdateQuery}
              />
            </Header>
            <CodeTitle title="Code" />
            <Code
              focusOnLoad={true}
              computing={computing}
              code={current.code}
              readOnly={!current.editable}
              onChange={this.handleCodeUpdate}
            />
          </div>
          <div className="col vm-column">
            <Header>
              <ButtonGroup>
                <Button variant="secondary" onClick={this.showBindings}>
                  Keyboard Shortcuts
                </Button>
                {computing ? <Spinner className="loading-spinner" /> : null}
              </ButtonGroup>
            </Header>

            <Preview
              title="Preview"
              scoped={true}
              result={current.result}
              computing={computing}
            />
          </div>
        </div>
      </div>
    );
  }
}
