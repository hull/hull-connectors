// @flow
import _ from "lodash";
import updateParent from "hull-vm/src/lib/update-parent";
import type {
  EngineState,
  Config,
  PreviewRequest,
  PreviewResponse
} from "../types";

type AnyFunction = any => any;

const EventEmitter = require("events");

const noop = () => {};
const EVENT = "CHANGE";
// const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

const DEFAULT_STATE = {
  computing: false,
  initialized: false,
  current: undefined,
  selected: undefined,
  recent: []
};

const queryParams = (): Config =>
  document.location.search
    .slice(1)
    .split("&")
    .reduce((q, p) => {
      const r = p.split("=");
      q[r[0].replace("ship", "id")] = r[1];
      return q;
    }, {});

export default class Engine extends EventEmitter {
  state: any;

  config: Config;

  computingState: any;

  constructor() {
    const config = queryParams();
    super();
    this.setState({ ...DEFAULT_STATE, config });
    this.fetchConfig();
  }

  fetchConfig = async () => {
    this.setState({ computing: true });
    try {
      const response = await this.request({
        url: "config",
        method: "get"
      });
      this.saveConfig(response);
      return true;
    } catch (err) {
      this.setState({
        error: err.message,
        token: "",
        hostname: "",
        computing: false,
        initialized: false
      });
      return false;
    }
  };

  // This methods finishes the init Sequence
  saveConfig = response => {
    this.setState({
      error: undefined,
      initialized: true,
      ...response
    });
  };

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

  updateParent = (code: string) => updateParent({ private_settings: { code } });

  updateCode = (code: string) => {
    const { current: old, language } = this.state;
    if (!old) return;
    const current = { ...old, code, language, editable: true };
    this.updateParent(code);
    this.setState({ current });
    this.fetchPreview(current);
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

  fetchPreview = _.debounce(
    async ({ language, code, payload, claims, entity }: PreviewRequest) => {
      this.setState({ computing: true });
      try {
        const response: PreviewResponse = await this.request({
          url: "preview",
          method: "post",
          data: { language, code, payload, claims, entity }
        });
        const state = this.getState();
        this.setState({
          error: undefined,
          computing: false,
          current: {
            ...state.current,
            result: response
          }
        });
        return true;
      } catch (err) {
        this.setState({
          error: err.message,
          computing: false
        });
        return false;
      }
    },
    1000,
    { leading: false, trailing: true }
  );
}
