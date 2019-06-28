// @flow

import React, { Component } from "react";

import Nav from "react-bootstrap/Nav";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";
import _ from "lodash";
import type Engine from "./engine";

type Props = {
  engine: Engine
};

type State = EngineState & {};

const DEFAULT_STATE = {};
export default class App extends RecentEntriesUI<Props, State> {
  constructor(props: any) {
    super(props);
  }
  render(){
    <div className="foo">Bar</div>
  }

}
