// @flow

import Engine from "./engine";

export default class ReplEngine extends Engine {
  state: {
    current: {
      code: string,
      payload: {}
    }
  };

  async callAPI() {
    this.setState({ computing: true });
    const current = await this.request({
      url: "call",
      method: "post",
      data: {
        code: this.state.current.code,
        preview: false
      }
    });
    this.setState({ computing: false });
    this.saveConfig({
      current
    });
    return true;
  }

  // This methods finishes the init Sequence
  saveConfig = response => {
    this.setState({
      error: undefined,
      initialized: true,
      current: {
        payload: {},
        ...response.current
      }
    });
  };
}
