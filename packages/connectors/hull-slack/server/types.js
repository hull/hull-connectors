// @flow

import type {
  HullClient as Hull,
  HullContext,
  HullConnector,
  HullClientCredentials,
  HullEntityName
} from "hull";

export type SlackChannel = {
  name: string,
  id: string
};
export type SlackMember = {
  name: string,
  id: string
};

export type ServerOptions = {
  port: number,
  hostSecret: string,
  clientID: string,
  clientSecret: string,
  Hull: Hull,
  devMode: boolean
};

export type SlackConnectorNotifyEvent = {
  channel: string,
  synchronized_segment: string,
  event: string,
  text: string
};
export type SlackConnectorAttachement = {
  block_title: string,
  attributes: Array<string>
};
export type SlackBotConfig = {
  bot_user_id: string,
  bot_access_token: string
};

export type SlackInstance = {
  botConfig: SlackBotConfig,
  clientCredentials: HullClientCredentials,
  attachements: Array<SlackConnectorAttachement>
};

export type SlackConnectorSettings = {|
  ...HullConnector,
  private_settings: {
    token: string,
    team_id: string,
    user_id: string,
    // actions: {},
    // whitelist
    attachements: Array<SlackConnectorAttachement>,
    notify_events: Array<SlackConnectorNotifyEvent>,
    incoming_webhook: {
      url: string,
      channel: string,
      channel_id: string,
      configuration_url: string
    },
    bot: SlackBotConfig,
    whitelist: Array<string>
  }
|};

export type ConnectedSlack = {
  attachements: Array<SlackConnectorAttachement>,
  getChannels: () => Promise<{
    teamChannels?: Array<SlackChannel>,
    teamMembers?: Array<SlackMember>
  }>,
  post?: ({
    scopedClient: Hull,
    payload: any,
    channel: string,
    entity: HullEntityName
  }) => any,
  tellOperator?: ({
    scopedClient: Hull,
    user_id: string,
    msg: string,
    error: any,
    entity: HullEntityName
  }) => any
};

export type HullSlackContext = HullContext & {
  connector: SlackConnectorSettings
};

export type ConnectSlackFunction = HullSlackContext => Promise<ConnectedSlack>;
