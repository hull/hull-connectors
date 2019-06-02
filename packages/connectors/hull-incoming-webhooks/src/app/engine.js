// @flow

import _ from "lodash";

import updateParent from "hull-vm/src/lib/update-parent";
import type {
  EngineState,
  Config,
  ConfResponse,
  Entry,
  Result,
  PreviewRequest,
  PreviewResponse
} from "hull-vm";

type AnyFunction = any => any;

const EventEmitter = require("events");

const noop = () => {};
const EVENT = "CHANGE";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*"
};

const DEFAULT_STATE = {
  loadingRecent: false,
  loadingToken: false,
  computing: false,
  initialized: false,
  current: undefined,
  selected: undefined,
  recent: []
};

export default class Engine extends EventEmitter {
  state: EngineState;

  config: Config;

  computingState: any;

  constructor(config: Config) {
    super();
    this.setState({ ...DEFAULT_STATE, config });
  }

  setState = (newState: { ...EngineState }, callback: AnyFunction = noop) => {
    this.state = { ...this.state, ...newState };
    this.emitChange();
    return callback();
  };

  getState = () => ({ ...this.state });

  emitChange = () => this.emit(EVENT);

  addChangeListener = (listener: AnyFunction) =>
    this.addListener(EVENT, listener);

  removeChangeListener = (listener: AnyFunction) =>
    this.removeListener(EVENT, listener);

  setup() {
    this.bootstrap();
    this.attemptFetchRecent();
  }

  attemptFetchRecent = async () => {
    const success = await this.fetchRecent();
    const { recent } = this.state;
    if (!success || !recent.length) {
      return setTimeout(this.attemptFetchRecent, 2000);
    }
    return this.selectEntry(_.head(recent));
  };

  updateParent = (code: string) => updateParent({ private_settings: { code } });

  updateCode = (code: string) => {
    const { current: old } = this.state;
    if (!old) return;
    const current = { ...old, code, editable: true };
    this.updateParent(code);
    this.setState({ current });
    this.fetchPreview(current);
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

  request = async ({
    url,
    method,
    data,
    headers
  }: {
    url: string,
    method?: "get" | "post",
    data?: {},
    headers?: {}
  }): Promise<any> => {
    const { config } = this.state;
    if (!config) {
      throw new Error("Can't find a proper config, please reload page");
    }
    const response = await fetch(`${url}?${this.getQueryString()}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  };

  getQueryString = () => {
    const { id, organization, secret } = this.state.config;
    return `id=${id}&organization=${organization}&secret=${secret}`;
  };

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
        loadingToken: false
      });
      return false;
    }
  };

  fetchRecent = async () => {
    this.setState({ loadingRecent: true });
    try {
      const recent: Array<Entry> = await this.request({
        url: "recent",
        headers: CORS_HEADERS
      });
      this.setState({ recent, loadingRecent: false, error: undefined });
      return true;
    } catch (err) {
      this.setState({ error: err.message, loadingRecent: false });
      return false;
    }
  };

  fetchPreview = _.debounce(
    async ({ code, payload }: PreviewRequest) => {
      this.setState({ computing: true });

      try {
        const response: PreviewResponse = await this.request({
          url: "preview",
          method: "post",
          data: { code, payload }
        });
        const state = this.getState();
        this.setState({
          error: undefined,
          computing: false,
          current: {
            ...state.current,
            result: response
          },
          initialized: true
        });
        return true;
      } catch (err) {
        this.setState({
          error: err.message,
          computing: false,
          current: undefined,
          initialized: true
        });
        return false;
      }
    },
    1000,
    { leading: false, trailing: true }
  );
}
