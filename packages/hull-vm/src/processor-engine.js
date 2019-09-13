// @flow

import _ from "lodash";
import type { EventSelect, Entry, ProcessorEngineState } from "hull-vm";
import Engine from "./engine";

type QueryParams = {
  claim?: string,
  selectedEvents: Array<EventSelect>
};

export default class ProcessorEngine extends Engine {
  state: ProcessorEngineState;

  constructor() {
    super();
    this.state.claim = this.getSearchCache();
    this.fetchEntry(this.state);
  }

  getSearchCache = (): string =>
    localStorage.getItem(`claim-${this.state.config.id}`);

  setSearchCache = (value: string) =>
    localStorage.setItem(`claim-${this.state.config.id}`, value);

  // This methods finishes the init Sequence
  saveConfig = response => {
    const { eventSchema = [], entityType } = response;
    const events = _.sortBy(
      eventSchema.map(e => ({ value: e.name, label: e.name })),
      e => e.label
    );
    this.setState({
      error: "empty",
      initialized: true,
      entityType,
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
    const { entityType } = this.state;
    const current = {
      ...entry,
      code: newCode,
      editable: true,
      claims,
      entityType
    };
    this.setState({ error: undefined, current });
    if (_.size(claims)) {
      this.fetchPreview(current);
    }
  };

  updateSearch = async (claim: string) => {
    const { claim: oldClaim, current } = this.state;
    this.setSearchCache(claim);
    this.setState({ claim });
    if (current && oldClaim !== claim) {
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
    claim = "",
    entityType = "",
    selectedEvents = []
  }: QueryParams) => {
    this.setState({ fetching: true });
    try {
      const entry: Entry = await this.request({
        url: "entry",
        method: "post",
        data: {
          claim,
          entityType,
          events: selectedEvents
        }
      });
      this.setState({ error: undefined });
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
    return undefined;
  };
}
