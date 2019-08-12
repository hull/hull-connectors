// @flow

import _ from "lodash";
import type { EventSelect, Config, Entry, ProcessorEngineState } from "hull-vm";
import Engine from "./vm-engine";

type QueryParams = {
  claim?: string,
  selectedEvents: Array<EventSelect>
};
export default class ProcessorEngine extends Engine {
  state: ProcessorEngineState;

  constructor(config: Config) {
    super(config);
    this.initialize(this.state);
  }

  initialize = async ({ claim, selectedEvents }: QueryParams) => {
    const entry = await this.fetchEntry({ claim, selectedEvents });
    this.saveEntry(entry);
  };

  saveConfig = response => {
    const { eventSchema } = response;
    const events = _.sortBy(
      eventSchema.map(e => ({ value: e.name, label: e.name })),
      e => e.label
    );
    this.setState({
      error: undefined,
      bootstrapping: false,
      ...response,
      events
    });
  };

  saveEntry = (entry?: Entry) => {
    this.setState({ entry });
    if (!entry || entry.error) {
      return;
    }
    const { code } = this.state.current || {};
    const newCode = code !== undefined ? code : entry.code;
    const claims = _.pick(entry.payload.user, ["id"]);
    const current = { ...entry, code: newCode, editable: true, claims };
    this.setState({ error: undefined, current });
    if (_.size(claims)) {
      this.fetchPreview(current);
    }
  };

  updateSearch = async (claim: string) => {
    const { claim: oldClaim, current } = this.state;
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
    async () => this.initialize(this.state),
    1000,
    {
      leading: false,
      trailing: true
    }
  );

  fetchEntry = async ({ claim = "", selectedEvents = [] }: QueryParams) => {
    this.setState({ loading: true });
    try {
      const entry: Entry = await this.request({
        url: "entry",
        method: "post",
        data: {
          claim,
          events: selectedEvents
        }
      });
      this.setState({ error: undefined });
      if (entry.error) {
        if (entry.error == "Empty query, can't fetch") {
          throw new Error(
            "Please enter the ID, anonymous ID or email of a user on the left"
          );
        }
        throw new Error(entry.error);
      }
      return entry;
    } catch (err) {
      this.setState({
        error: err.message,
        current: {
          ...this.state.current,
          payload: undefined
        },
        loading: false
      });
      // throw err;
      // return false;
    }
  };
}
