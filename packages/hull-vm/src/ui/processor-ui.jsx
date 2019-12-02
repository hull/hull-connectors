// @flow

import React, { Fragment } from "react";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import Code from "./code";
import Preview from "./preview";
import KeyBindings from "./key-bindings";
import EntrySelector from "./entry-selector";
import EventSelector from "./event-selector";
import Area from "./area";
import Header from "./header";
import CodeTitle from "./code-title";
import Spinner from "./spinner";

import VirtualMachineUI from "./vm-ui";
import type { EngineState } from "../../types";
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

  getError = () => {
    const { error } = this.state;
    if (error === "empty") {
      return this.props.strings.leftColumnPreview;
    }
    if (error === "notfound") {
      return this.props.strings.leftColumnEmpty;
    }
    return error;
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
      error,
      entity,
      search
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
          <div className="col-3 vm-column">
            <Header>
              <EntrySelector
                loading={computing || fetching}
                current={current}
                defaultValue={search}
                title={strings.leftColumnTitle}
                recent={recent}
                onChange={this.handleUpdateQuery}
              >
                <div className="spinner">
                  {fetching || computing ? (
                    <Spinner
                      style={{ marginLeft: "1rem" }}
                      className="loading-spinner"
                    />
                  ) : null}
                </div>
              </EntrySelector>
            </Header>
            <CodeTitle title="Payload" />
            <Area
              id="code-payload"
              mode="json"
              value={this.getError() || current.payload}
            />
          </div>
          <div className="col vm-column code-column">
            <Header>
              {entity === "user" ? (
                <EventSelector
                  loading={!initialized && fetching}
                  onChange={this.handleUpdateEvents}
                  events={events}
                />
              ) : (
                "Enter an account identifier"
              )}
            </Header>
            <CodeTitle
              title={`Code ${
                !current.editable
                  ? "(disabled - first search for something on the left panel)"
                  : ""
              }`}
            />
            <Code
              focusOnLoad={true}
              computing={computing}
              code={current.code}
              readOnly={!current.editable}
              onChange={this.handleCodeUpdate}
            />
          </div>
          <div className="col-3 vm-column">
            <Header>
              <ButtonGroup>
                <Button variant="secondary" onClick={this.showBindings}>
                  Keyboard Shortcuts
                </Button>
              </ButtonGroup>
            </Header>

            <Preview
              title="Preview"
              scoped={true}
              entity={entity}
              result={error ? {} : current.result}
              computing={computing}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}
