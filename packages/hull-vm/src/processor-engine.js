// @flow

import _ from "lodash";
import type { Config, Entry, ProcessorEngineState } from "hull-vm";
import Engine from "./vm-engine";

export default class ProcessorEngine extends Engine {
  state: ProcessorEngineState;

  constructor(config: Config) {
    super(config);
    const { search } = this.state;
    this.initialize(search);
  }

  initialize = async (search: string) => {
    const entry = await this.fetchEntry(search);
    this.saveEntry(entry);
  };

  saveConfig = response => {
    const { eventSchema } = response;
    const events = eventSchema.map(e => ({ value: e.name, label: e.name }));
    this.setState({
      error: undefined,
      bootstrapping: false,
      ...response,
      events
    });
  };

  saveEntry = (entry?: Entry) => {
    this.setState({ entry });
    if (!entry) {
      return;
    }
    const { code } = this.state.current || {};
    const newCode = code !== undefined ? code : entry.code;
    const claims = _.pick(entry.payload.user, ["id"]);
    const current = { ...entry, code: newCode, editable: true, claims };
    this.setState({ current });
    if (_.size(claims)) {
      this.fetchPreview(current);
    }
  };

  updateQuery = async (search: string) => {
    const { search: oldSearch, current } = this.state;
    this.setState({ search });
    if (current && oldSearch !== search) {
      this.fetchEntryDebounced();
    }
  };

  fetchEntryDebounced = _.debounce(
    async () => this.initialize(this.state.search),
    1000,
    {
      leading: false,
      trailing: true
    }
  );

  fetchEntry = async (search: string) => {
    this.setState({ initializing: true });
    try {
      const entry: Entry = await this.request({
        url: "entry",
        method: "post",
        data: { search }
      });
      this.setState({ error: undefined });
      return entry;
    } catch (err) {
      this.setState({ error: err.message, initializing: false });
      return false;
    }
  };
}
