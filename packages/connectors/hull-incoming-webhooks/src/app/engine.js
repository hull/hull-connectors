// @flow

import _ from "lodash";
import axios from "axios";
import updateParent from "hull-vm/src/lib/update-parent";
import type {
  EngineState,
  Config,
  ConfResponse,
  Entry,
  Result,
  PreviewRequest
} from "../../types";

type Axios<T> = {
  data: T,
  status: number
};
type AxiosComputeResult = Axios<Result>;
type AxiosConfResponse = Axios<ConfResponse>;
type AxiosRecentResponse = Axios<Array<Entry>>;
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
  code: "",
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

  getState = () => this.state;

  emitChange = () => this.emit(EVENT);

  addChangeListener = (listener: AnyFunction) =>
    this.addListener(EVENT, listener);

  removeChangeListener = (listener: AnyFunction) =>
    this.removeListener(EVENT, listener);

  setup() {
    this.fetchToken();
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
    const { current } = this.state;
    if (!current) return;
    const { payload } = current;
    this.updateParent(code);
    this.setState({ code });
    this.preview({ code, payload });
  };

  selectEntry = (current?: Entry) => {
    this.setState({ current });
    if (!current) return;
    const { payload } = current;
    this.preview({ code: this.state.code, payload });
  };

  selectEntryByDate = (date: string) => {
    const { recent } = this.state;
    this.selectEntry(_.find(recent, entry => entry.date === date));
  };

  request = async (payload: {
    url: string,
    method?: "get" | "post",
    data?: {},
    headers?: {}
  }): Promise<any> => {
    const { config } = this.state;
    if (!config) {
      throw new Error("Can't find a proper config, please reload page");
    }
    return axios({ method: "get", params: config, ...payload });
  };

  fetchToken = async () => {
    this.setState({ loadingToken: true });
    try {
      const { data, status }: AxiosConfResponse = await this.request({
        url: "conf",
        method: "get"
      });
      if (status !== 200) {
        throw new Error("Can't load Token");
      }
      this.setState({ ...data, loadingToken: false });
    } catch (err) {
      console.log(err);
      this.setState({ token: "", hostname: "", loadingToken: false });
    }
  };

  fetchRecent = async () => {
    this.setState({ loadingRecent: true });
    try {
      const {
        data: recent = [],
        status
      }: AxiosRecentResponse = await this.request({
        url: "recent",
        headers: CORS_HEADERS
      });
      if (status !== 200) {
        throw new Error("Can't fetch recent webhooks");
      }
      this.setState({ recent, loadingRecent: false });
      return true;
    } catch (err) {
      console.log(err);
      this.setState({
        error: err.toString(),
        loadingRecent: false
      });
      return false;
    }
  };

  preview = _.debounce(
    async (request: PreviewRequest) => {
      // const { computing } = this.state;
      // if (computing) {
      //   return computing;
      // }
      this.setState({ computing: true });

      try {
        const { data, status }: AxiosComputeResult = await this.request({
          url: "preview",
          method: "post",
          data: request
        });
        if (status !== 200) {
          throw new Error("Can't compute result");
        }
        this.setState({
          computing: false,
          result: data,
          initialized: true
        });
      } catch (err) {
        console.log(err);
        this.setState({
          computing: false,
          error: err.toString(),
          initialized: true
        });
      }
      return true;
    },
    1000,
    { leading: false, trailing: true }
  );
}
