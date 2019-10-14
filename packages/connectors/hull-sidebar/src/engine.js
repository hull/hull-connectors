// @flow
import _ from "lodash";

type AnyFunction = any => any;

const EventEmitter = require("events");

const noop = () => {};
const EVENT = "CHANGE";
// const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

const DEFAULT_STATE = {
  initializing: false,
  bootstrapping: false,
  computing: false,
  initialized: false,
  current: undefined,
  selected: undefined,
  recent: []
};
type EngineState = {
  token?: string,

  initializing: boolean,
  initialized: boolean,
};

export default class Engine extends EventEmitter {
  state: any;

  clientCredentialsEncryptedToken: string;

  computingState: any;

  constructor() {
    const clientCredentialsEncryptedToken = window.location.pathname.split(
      "/"
    )[3];
    super();
    this.setState({ ...DEFAULT_STATE, clientCredentialsEncryptedToken });
    this.bootstrap();
  }

  setState = (newState: { ...EngineState }, callback: AnyFunction = noop) => {
    this.state = { ...this.state, ...newState };
    this.emitChange();
    return callback();
  };

  getState = () => ({ ...this.state });

  emitChange = () => this.emit(EVENT);

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

  fetchPreview = _.debounce(
    async ({ code, payload, claims }: PreviewRequest) => {
      this.setState({ computing: true });

      try {
        const response: PreviewResponse = await this.request({
          url: "preview",
          method: "post",
          data: { code, payload, claims }
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
