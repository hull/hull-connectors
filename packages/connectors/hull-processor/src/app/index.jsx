// @flow

import React, { Component } from "react";

import Nav from "react-bootstrap/Nav";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import { ConfigurationModal, Spinner, ProcessorUI } from "hull-vm/src/ui";
import _ from "lodash";

import type { EngineState, Entry, Result } from "hull-vm";
import type Engine from "./engine";

type Props = {
  engine: Engine
};

type State = EngineState & {};

const DEFAULT_STATE = {};
export default class App extends ProcessorUI<Props, State> {
  constructor(props: any) {
    super(props);
  }
}
