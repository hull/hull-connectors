// @flow

import type { HullExternalResponse, HullHandlersConfiguration } from "hull";

import statusHandler from "./status-handler";
import importHandler from "./import-handler";
import schemaHandler from "./schema-handler";
// import adminHandler from "./admin-handler";
import credentialsHandler from "./credentials-handler";
import installHandler from "./install-handler";

const handler = ({
  installUrl
}: {
  installUrl: string
}): HullHandlersConfiguration => ({
  json: {
    schemaHandler,
    credentialsHandler,
    installHandler: installHandler(installUrl)
  },
  html: {
    // adminHandler,
    sidebarHandler: (): HullExternalResponse => ({
      pageLocation: "/sidebar.html"
    })
  },
  incoming: {
    importHandler
  },
  status: {
    statusHandler
  },
  subscriptions: {}
});

export default handler;
