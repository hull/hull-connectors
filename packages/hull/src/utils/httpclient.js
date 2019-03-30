//@flow
import type { HullContext, HullHTTPClientConfig} from "hull";
import superagent from "superagent";
import SuperagentThrottle from "superagent-throttle";
import prefixPlugin from "superagent-prefix";
import {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin,
  superagentErrorPlugin
} from "../utils";


const throttle_pool = {}

export default function httpRequestLibrary(ctx: HullContext){
  const { client, metric, connectorConfig, clientCredentials } = ctx;
  const { id } = clientCredentials;
  // @TODO: Probably better to access the object stored in the Connector instance in case we decide to manipulate it, the currently used object is the unprocessed object from the HullConnectorConfig
  const { httpClientConfig = {} } = connectorConfig;
  const {
    throttle = {},
    timeout = 10000,
    prefix = ""
  } = httpClientConfig;
  const { logger } = client;


  const agent = superagent
  .agent()
  .set({ "Content-Type": "application/json" })
  .use(superagentInstrumentationPlugin({ logger, metric }))
  .ok(res => res.status === 200);

  //@TODO: Document this behaviour
  //@TODO: If throttle === false we explicitely disable throttling
  //@TODO: If throttle is undefined we set default throttling
  if (throttle || throttle === undefined) {
    const {
      rate = 30, // how many requests can be sent every `ratePer`
      ratePer = 1000, // number of ms in which `rate` requests may be sent
      concurrent = 1 // how many requests can be sent concurrently
    } = throttle;
    throttle_pool[id] = throttle_pool[id] || new SuperagentThrottle({
      rate: parseInt(rate, 10),
      ratePer: parseInt(ratePer, 10),
      concurrent: parseInt(concurrent, 10)
    });
    agent.use(throttle_pool[id].plugin());
  }

  if (timeout) {
    agent.use(superagentErrorPlugin({ timeout }));
  }
  if (prefix){
    agent.use(prefixPlugin(prefix));
  }

  return agent;

  // .use(superagentUrlTemplatePlugin())
  // .auth(this.auth.username, this.auth.password)
  // we reject the promise for all non 200 responses

}
