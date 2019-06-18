// @flow

import _ from "lodash";
import type { Config, Entry, RecentEngineState} from "hull-vm";
import Engine from "./vm-engine";

export default class RecentEntriesEngine extends Engine {
  state: RecentEngineState;

  constructor(config: Config) {
    super(config);
    this.initialize();
  }

  initialize = async () => {
    const success = await this.fetchRecent();
    const { recent } = this.state;
    if (!success || !recent.length) {
      return setTimeout(this.initialize, 2000);
    }
    return this.selectEntry(_.head(recent));
  };

  selectEntry = (selected?: Entry) => {
    this.setState({ error: undefined, selected });
    if (!selected) return;
    const { code } = this.state.current || {};
    const newCode = code !== undefined ? code : selected.code;
    const current = { ...selected, code: newCode, editable: true };
    this.setState({ current });
    this.fetchPreview(current);
  };

  selectEntryByDate = (date: string) => {
    const { recent } = this.state;
    this.selectEntry(_.find(recent, entry => entry.date === date));
  };

  fetchRecent = async () => {
    this.setState({ initializing: true });
    try {
      const recent: Array<Entry> = await this.request({
        url: "recent"
      });
      this.setState({ recent, initializing: false, error: undefined });
      return true;
    } catch (err) {
      this.setState({ error: err.message, initializing: false });
      return false;
    }
  };
}
