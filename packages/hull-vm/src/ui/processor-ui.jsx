// @flow

import React, { Component, Fragment } from "react";

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

  handleUpdateQuery = e => {
    const query = e.target.value;
    const { engine } = this.props;
    engine.updateSearch(query);
  };

  handleUpdateEvents = events => {
    const { engine } = this.props;
    engine.updateEvents(events);
  };

  render() {
    const {
      current,
      fetching,
      initialized,
      recent,
      computing,
      showBindings,
      events,
      error
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
      <Fragment>
        <KeyBindings show={showBindings} onHide={this.hideBindings} />
        <div className="main-container row no-gutters">
          <div className="col vm-column">
            <Header>
              <EntrySelector
                loading={computing || fetching}
                current={current}
                recent={recent}
                onChange={this.handleUpdateQuery}
              />
              <hr className="payload-divider" />
            </Header>
            <CodeTitle title="Payload" />
            <Area
              id="code-payload"
              mode="json"
              value={error || current.payload}
            />
          </div>
          <div className="col vm-column code-column">
            <Header>
              <EventSelector
                loading={!initialized && fetching}
                onChange={this.handleUpdateEvents}
                events={events}
              />
            </Header>
            <CodeTitle
              title={`Code ${!current.editable ? "(disabled)" : ""}`}
            />
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
              result={error ? {} : current.result}
              computing={computing}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}
