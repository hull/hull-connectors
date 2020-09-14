// @flow
import RecentEntriesEngine from "hull-vm/src/recent-engine";

export default class IncomingWebhookEngine extends RecentEntriesEngine {
  async callAPI(execute: boolean) {
    this.setState({ computing: true });
    const current = await this.request({
      url: "call",
      method: "post",
      data: {
        code: this.state.code,
        language: this.state.language,
        preview: !execute
      }
    });
    this.setState({ computing: false });
    this.saveConfig({ current });
    return true;
  }
}
