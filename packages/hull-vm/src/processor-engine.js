// @flow

import _ from "lodash";
import type {
  ProcessorConfResponse,
  EventSelect,
  Entry,
  ProcessorEngineState
} from "../types";
import Engine from "./engine";

const ERROR_MESSAGES = {
  "Can't search for an empty value": "empty",
  "No entity found": "notfound"
};

export default class ProcessorEngine extends Engine {
  state: ProcessorEngineState;

  constructor() {
    super();
    this.state.search = this.getSearchCache();
  }

  getSearchCache = (): string =>
    (this.state.config &&
      localStorage.getItem(`search-${this.state.config.id}`)) ||
    "";

  setSearchCache = (value: string) =>
    this.state.config &&
    localStorage.setItem(`search-${this.state.config.id}`, value);

  // This methods finishes the init Sequence
  saveConfig = (config: ProcessorConfResponse) => {
    const { eventSchema = [] } = config;
    this.setState({
      error: "empty",
      initialized: true,
      ...config,
      events: _.sortBy(
        eventSchema.map(e => ({ value: e.name, label: e.name })),
        e => e.label
      )
    });
    this.fetchEntry(this.getEntryData());
  };

  saveEntry = (entry?: Entry) => {
    if (!entry || entry.error !== undefined) {
      return;
    }
    const claims = _.get(entry, "result.claims");
    this.setState({
      error: undefined,
      current: {
        ...entry,
        claims
      },
      editable: true
    });
    this.setState({ computing: false });
  };

  getPreviewData = () => {
    const { code } = this.getState();
    return { code };
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
    async () => this.fetchEntry(this.getEntryData()),
    1000,
    {
      leading: false,
      trailing: true
    }
  );

  getEntryData = () => {
    return {
      ..._.omit(this.state, "selectedEvents"),
      include: {
        events: {
          names: this.state.selectedEvents
        }
      }
    };
  };

  fetchEntry = async (data: {}) => {
    this.setState({ fetching: true });
    try {
      const entry: Entry = await this.request({
        url: "entry",
        method: "post",
        data
      });
      this.setState({ error: undefined, fetching: false });
      this.saveEntry(entry);
    } catch (error) {
      const message = ERROR_MESSAGES[error.message] || error.message;
      this.setState({
        error: message,
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
