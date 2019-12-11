// @flow

import _ from "lodash";
import type { HullEntityName, HullFetchedUser } from "hull";
import type { ProcessorEngineState } from "hull-vm";
import Engine from "./engine";

type QueryParams = {
  search?: string,
  entity: HullEntityName
};

type Payloads = {
  per_page: number,
  page: number,
  data: Array<HullFetchedUser>
};
type Response =
  | { error: string }
  | {
      connectorId: string,
      date: string,
      payloads: Payloads
    };

export default class ProcessorEngine extends Engine {
  state: ProcessorEngineState;

  constructor() {
    super();
    this.state.search = this.getSearchCache("search");
    // $FlowFixMe
    this.state.entity = this.getSearchCache("entity");
    // this.fetchEntries(this.state);
  }

  getSearchCache = (key: string): string =>
    localStorage.getItem(`${key}-${this.state.config.id}`);

  setSearchCache = (key: string, value: string) =>
    localStorage.setItem(`${key}-${this.state.config.id}`, value);

  // This methods finishes the init Sequence
  saveConfig = response => {
    this.setState({
      error: "empty",
      initialized: true,
      ...response
    });
    this.fetchEntries(this.state);
  };

  saveResponse = (payloads?: Payloads) => {
    this.setState({ payloads });
    if (!payloads) {
      return;
    }
    this.setState({
      error: undefined,
      fetching: false,
      computing: false,
      ...payloads
    });
  };

  updateSearch = async (search: string) => {
    const { search: oldSearch, current } = this.state;
    this.setSearchCache("search", search);
    this.setState({ search });
    if (current && oldSearch !== search) {
      this.fetchEntriesDebounced();
    }
  };

  selectEntity = index => {
    this.setState({
      selectedIndex: index,
      selected: this.state.data[index]
    });
  };

  updateEntity = async (entity: string) => {
    const { entity: oldEntity, current } = this.state;
    this.setSearchCache("entity", entity);
    this.setState({ entity });
    if (current && oldEntity !== entity) {
      this.fetchEntriesDebounced();
    }
  };

  fetchEntriesDebounced = _.debounce(
    async () => this.fetchEntries(this.state),
    1000,
    {
      leading: false,
      trailing: true
    }
  );

  fetchEntries = async ({ search = "", entity }: QueryParams) => {
    if (!entity) {
      return;
    }
    this.setState({ fetching: true });
    try {
      const response: Response = await this.request({
        url: "entries",
        method: "post",
        data: {
          search,
          entity,
          include: {
            events: false
          }
        }
      });
      this.setState({ error: undefined, fetching: false });
      if (response.error !== undefined) {
        if (response.error === "Can't search for an empty value") {
          throw new Error("empty");
        }
        if (response.error === "No entity found") {
          throw new Error("notfound");
        }
        throw new Error(response.error);
      }
      this.saveResponse(response.payloads);
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
