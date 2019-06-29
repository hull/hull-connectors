//@flow

// ====================================
//   Incoming request handlers - everything that doesn't come from Kraken or Batch
// ====================================
// @TODO: evolve this introducing envelope etc.
// === External Handler request. for use in (ctx, message: HullIncomingHandlerMessage) signatures
type HandlerMap = { [string]: any };

export type HullIncomingHandlerMessage = {|
  ip: string,
  url: string,
  method: string,
  protocol: string,
  hostname: string,
  path: string,
  params: HandlerMap,
  query: HandlerMap,
  headers: HandlerMap,
  cookies: HandlerMap,
  body?: {}
|};
