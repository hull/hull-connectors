// @flow
import RecentEntriesEngine from "hull-vm/src/recent-engine";
import type { Config, ConfResponse /* , Entry*/ } from "hull-vm";

export default class IncomingWebhookEngine extends RecentEntriesEngine {
  constructor(config: Config) {
    super(config);
    this.bootstrap();
  }

  bootstrap = async () => {
    this.setState({ loadingToken: true });
    try {
      const { url, current }: ConfResponse = await this.request({
        url: "config",
        method: "get"
      });
      this.setState({ url, current, loadingToken: false, error: undefined });
      return true;
    } catch (err) {
      this.setState({
        error: err.message,
        token: "",
        hostname: "",
        initialized: false
      });
      return false;
    }
  };
}
