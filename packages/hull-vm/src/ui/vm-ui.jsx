// @flow

import { Component } from "react";

import Nav from "react-bootstrap/Nav";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Button from "react-bootstrap/Button";

import _ from "lodash";
import Code from "./code"
import Preview from "./preview"
import KeyBindings from "./key-bindings"
import PayloadSelector from "./payload-selector"
import ConfigurationModal from "./configuration-modal"
import Area from "./area"
import Header from "./header"
import CodeTitle from "./code-title"
import Spinner from "./spinner"
import type { EngineState, Entry, Result } from "../../types";
import type Engine from "../engine";

type Props = {
  engine: Engine,
  language?: string,
  strings: {
    [string]: string
  }
};

type State = EngineState & {
  showBindings: boolean,
  activeTab: string
};

const DEFAULT_STATE = {
  showBindings: false,
  activeTab: "Current"
};

export default class VirtualMachineUI extends Component<Props, State> {
  state = {
    ...DEFAULT_STATE,
    // eslint-disable-next-line react/destructuring-assignment
    ...this.props.engine.getState()
  };

  UNSAFE_componentWillMount() {
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

  handleCodeUpdate = (code: string) => {
    const { engine } = this.props;
    engine.updateCode(code);
  };

  hideBindings = () => this.setState({ showBindings: false });
  showBindings = () => this.setState({ showBindings: true });

  render() {
    return null;
  }
}
