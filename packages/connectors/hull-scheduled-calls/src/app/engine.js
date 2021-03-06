// @flow
import RecentEntriesEngine from "hull-vm/src/recent-engine";

export default class IncomingWebhookEngine extends RecentEntriesEngine {
  async callAPI(execute: boolean) {
    this.setState({ computing: true });
    const response = await this.request({
      url: "call",
      method: "post",
      data: {
        ...this.state.current,
        preview: !execute
      }
    });
    this.setState({ computing: false });
    this.saveConfig(response);
    return true;
  }
}
