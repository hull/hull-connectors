// @flow
/* eslint-disable global-require */
import type { HullHandlersConfiguration, Connector } from "hull";
import statusHandler from "./status";
import fetchDestination from "./fetch-destinations";
import oauth from "./oauth";
import admin from "./admin";
import userUpdate from "./user-update";
import accountUpdate from "./account-update";
import shipUpdate from "./ship-update";
import BotFactory from "../bot";

const handler = ({
  clientID,
  clientSecret,
  scopes,
  signingSecret
}: {
  clientID: string,
  clientSecret: string,
  scopes: Array<string>,
  signingSecret?: string
}) => (connector: Connector): HullHandlersConfiguration => {
  const { connectorConfig, app } = connector;

  const { /* hostSecret, port, */ devMode } = connectorConfig;

  const { controller, connectSlack } = BotFactory({
    webserver: app,
    scopes,
    clientID,
    clientSecret,
    signingSecret,
    devMode
  });
  return {
    statuses: { statusHandler },
    subscriptions: {
      userUpdate: userUpdate(connectSlack),
      accountUpdate: accountUpdate(connectSlack),
      shipUpdate: shipUpdate(connectSlack)
    },
    json: {
      fetchDestination: fetchDestination(connectSlack)
    },
    tabs: {
      admin
    },
    private_settings: {
      oauth: oauth({
        clientID,
        clientSecret,
        controller,
        connectSlack
      })
    }
  };
};

export default handler;
