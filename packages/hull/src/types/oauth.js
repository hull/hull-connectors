//@flow

export type HullOAuthHandlerParams = void | {
  onAuthorize?: (
    ctx: HullContext,
    message: HullOauthAuthorizeMessage
  ) => HullOAuthAuthorizeResponse,
  onStatus?: (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ) => HullSettingsResponse,
  onLogin?: (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ) => HullExternalResponse,
  Strategy: any,
  clientID: string,
  clientSecret: string
};
export type HullOAuthHandlerOptions = {
  name: string,
  tokenInUrl?: boolean,
  strategy: {
    authorizationURL: string,
    tokenURL: string,
    grant_type: string,
    scope: Array<string>
  }
};
