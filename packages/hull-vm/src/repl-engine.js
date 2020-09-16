// @flow

import type { ReplConfResponse } from "../types";
import Engine from "./engine";

export default class ReplEngine extends Engine {
  // This methods finishes the init Sequence
  getPreviewData = () => {
    const { code } = this.getState();
    return { code };
  };

  saveConfig = (config: ReplConfResponse) => {
    this.setState({
      error: undefined,
      initialized: true,
      current: {
        payload: {}
      },
      ...config
    });
    this.fetchPreview(this.getPreviewData());
  };

  async callAPI() {
    this.setState({ computing: true });
    const current = await this.request({
      url: "call",
      method: "post",
      data: {
        code: this.state.code,
        preview: false
      }
    });
    this.setState({
      computing: false,
      current
    });
    return true;
  }
}
