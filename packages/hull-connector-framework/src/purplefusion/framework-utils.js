/* @flow */
const _ = require("lodash");
const momentConstructor = require("moment");

const { doVariableReplacement } = require("./variable-utils");
const uri = require("urijs");

class FrameworkUtils {

  createWebhookUrl(context: Object, params: any): string {
    const client = context.client;
    const { organization, id, secret } = client.configuration();
    const search = {
      organization,
      secret,
      ship: id
    };
    return uri(`https://${context.hostname}/webhooks`)
      .search(search)
      .toString();
  }

  getConnectorHostname(context: Object, params: any): string {
    return context.hostname;
  }

  getConnectorOrganization(context: Object, params: any): string {
    const client = context.client;
    const { organization } = client.configuration();
    return organization;
  }

  moment(context: Object): Object {
    return momentConstructor();
  }

  emptyArray(): Object {
    return [];
  }

}
module.exports = {
  FrameworkUtils
}
