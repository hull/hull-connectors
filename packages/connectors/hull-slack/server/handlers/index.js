// @flow
/* eslint-disable global-require */
import type { HullHandlersConfiguration, Connector } from "hull";
import { Strategy } from "passport-slack";
import status from "./status";
import onStatus from "./on-status";
import fetchDestination from "./fetch-destinations";
import onAuthorize from "./on-authorize";
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

  const { connectSlack } = BotFactory({
    webserver: app,
    scopes,
    clientID,
    clientSecret,
    signingSecret,
    devMode
  });
  return {
    statuses: { status: status(connectSlack) },
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
      oauth: () => ({
        onAuthorize: onAuthorize(connectSlack),
        onStatus: onStatus(connectSlack),
        Strategy,
        clientID,
        clientSecret
      })
    }
  };
};

export default handler;
