// @flow

import _ from "lodash";
import React, { Fragment } from "react";

import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import Code from "./code";
import Preview from "./jsonata-preview";
import KeyBindings from "./key-bindings";
import EntrySelector from "./entry-selector";
import EventSelector from "./event-selector";
import Area from "./area";
import Header from "./header";
import CodeTitle from "./code-title";
import Spinner from "./spinner";

import type { EngineState } from "../../types";
import type ProcessorEngine from "../processor-engine";
import VirtualMachineUI from "./vm-ui";

type Props = {
  strings: {
    [string]: string
  },
  engine: ProcessorEngine
};

type State = EngineState;

const DEFAULT_STATE = {
  showConfig: false
};

export default class JsonataUI extends VirtualMachineUI<Props, State> {
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
    engine.updateEvents(_.isArray(events) ? events : [events]);
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

  renderComposer() {
    return <div></div>;
  }

  render() {
    const {
      url,
      headers,
      current,
      fetching,
      initialized,
      recent,
      computing,
      showBindings,
      events,
      error,
      entity,
      search,
      language,
      code,
      editable
    } = this.state;
    const { strings } = this.props;

    const errors = _.compact([error, ...(current?.result?.errors || [])]);
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
            <CodeTitle title="Notification Content" />
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
            {this.renderComposer()}
          </div>
        </div>
      </Fragment>
    );
  }
}
