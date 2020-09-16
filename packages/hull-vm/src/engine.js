// @flow
import _ from "lodash";
import updateParent from "hull-vm/src/lib/update-parent";
import type {
  ConfResponse,
  EngineState,
  Config,
  PreviewResponse
} from "../types";

type AnyFunction = any => any;

const EventEmitter = require("events");

const noop = () => {};
const EVENT = "CHANGE";
// const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

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
  state: {};

  state = {
    code: undefined,
    language: undefined,
    config: undefined,
    entity: undefined,
    error: undefined,
    computing: false,
    initialized: false,
    loading: false,
    search: "",
    current: undefined,
    selected: undefined,
    recent: []
  };

  config: Config;

  computingState: any;

  constructor() {
    const config = queryParams();
    super();
    this.setState({ config });
    this.fetchConfig();
  }

  fetchConfig = async () => {
    this.setState({ computing: true });
    try {
      const config: ConfResponse = await this.request({
        url: "config",
        method: "get"
      });
      this.saveConfig(config);
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
  saveConfig = (config: ConfResponse) => {
    this.setState({
      error: undefined,
      initialized: true,
      ...config
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

  updateParent = (private_settings: {}) => updateParent({ private_settings });

  updateCode = (code: string) => {
    const { current } = this.state;
    if (!current) return;
    this.updateParent({ code });
    this.setState({ code });
    this.fetchPreview({ code });
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
    let body;
    try {
      body = await response.json();
    } catch (err) {
      body = {};
    }
    const { error } = body;
    if (!response.ok || error) {
      throw new Error(error || response.statusText);
    }
    return body;
  };

  getQueryString = () => {
    const { id, organization, secret } = this.state.config;
    return `id=${id}&organization=${organization}&secret=${secret}`;
  };

  fetchPreview = _.debounce(
    async data => {
      this.setState({ computing: true });
      try {
        const { current, entity, language } = this.getState();
        const result: PreviewResponse = await this.request({
          url: "preview",
          method: "post",
          data: {
            language,
            entity,
            ..._.pick(current, ["payload", "claims"]),
            ...data
          }
        });
        this.setState({
          error: undefined,
          computing: false,
          current: {
            ...current,
            result
          }
        });
        return true;
      } catch (error) {
        this.setState({
          error: `Error fetching Preview: ${error.message}`,
          computing: false
        });
        return false;
      }
    },
    1000,
    { leading: false, trailing: true }
  );
}
