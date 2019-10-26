// @flow

import _ from "lodash";
import type { EventSelect, Entry, ProcessorEngineState } from "hull-vm";
import Engine from "./engine";

type QueryParams = {
  search?: string,
  entity: "user" | "account",
  selectedEvents: Array<EventSelect>
};

export default class ProcessorEngine extends Engine {
  state: ProcessorEngineState;

  constructor() {
    super();
    this.state.search = this.getSearchCache();
    this.fetchEntry(this.state);
  }

  getSearchCache = (): string =>
    localStorage.getItem(`search-${this.state.config.id}`);

  setSearchCache = (value: string) =>
    localStorage.setItem(`search-${this.state.config.id}`, value);

  // This methods finishes the init Sequence
  saveConfig = response => {
    const { eventSchema = [], entity } = response;
    const events = _.sortBy(
      eventSchema.map(e => ({ value: e.name, label: e.name })),
      e => e.label
    );
    this.setState({
      error: "empty",
      initialized: true,
      entity,
      ...response,
      events
    });
    this.fetchEntry(this.state);
  };

  saveEntry = (entry?: Entry) => {
    this.setState({ entry });
    if (!entry || entry.error) {
      return;
    }
    const { code } = this.state.current || {};
    const newCode = code !== undefined ? code : entry.code;
    const claims = _.get(entry, "result.claims");
    const { entity } = this.state;
    const current = {
      ...entry,
      code: newCode,
      editable: true,
      claims,
      entity
    };
    this.setState({ error: undefined, current });
    if (_.size(claims)) {
      this.fetchPreview(current);
    }
  };

  updateSearch = async (search: string) => {
    const { search: oldSearch, current } = this.state;
    this.setSearchCache(search);
    this.setState({ search });
    if (current && oldSearch !== search) {
      this.fetchEntryDebounced();
    }
  };

  updateEvents = async (events: Array<EventSelect>) => {
    const newSelectedEvents = _.map(events, e => e.value);
    const { selectedEvents: oldSelectedEvents } = this.state;
    this.setState({ selectedEvents: newSelectedEvents });
    if (!_.isEqual(_.sortBy(oldSelectedEvents), _.sortBy(newSelectedEvents))) {
      this.fetchEntryDebounced();
    }
  };

  fetchEntryDebounced = _.debounce(
    async () => this.fetchEntry(this.state),
    1000,
    {
      leading: false,
      trailing: true
    }
  );

  fetchEntry = async ({
    search = "",
    entity,
    selectedEvents = []
  }: QueryParams) => {
    if (!entity) {
      return;
    }
    this.setState({ fetching: true });
    try {
      const entry: Entry = await this.request({
        url: "entry",
        method: "post",
        data: {
          search,
          entity,
          include: {
            events: {
              names: selectedEvents
            }
          }
        }
      });
      this.setState({ error: undefined, fetching: false });
      if (entry.error) {
        if (entry.error === "Can't search for an empty value") {
          throw new Error("empty");
        }
        throw new Error(entry.error);
      }
      this.saveEntry(entry);
    } catch (err) {
      this.setState({
        error: err.message,
        computing: false,
        fetching: false,
        current: {
          ...this.state.current,
          editable: false,
          payload: undefined
        }
      });
    }
  };
}
