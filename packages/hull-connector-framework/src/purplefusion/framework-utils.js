/* @flow */

import Hull from "hull";

const _ = require("lodash");
const momentConstructor = require("moment");
const hash = require('object-hash');
const jwt = require("jwt-simple");

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

  createWebhookUrlWithEncryptedToken(context: Object, params: any): string {
    const clientCredentialsEncryptedToken = _.get(context, "clientCredentialsEncryptedToken");
    const search = {
      hullToken: clientCredentialsEncryptedToken
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

  getConnectorId(context: Object, params: any): string {
    const client = context.client;
    const { id } = client.configuration();
    return id;
  }

  getConnectorSecret(context: Object, params: any): string {
    const client = context.client;
    const { secret } = client.configuration();
    return secret;
  }

  getConnectorEncryptedToken(context: Object): string {
    return _.get(context, "clientCredentialsEncryptedToken");
  }

  moment(context: Object): Object {
    return momentConstructor();
  }

  emptyArray(): Object {
    return [];
  }

  emptyObject(): Object {
    return {};
  }

  base64Encode(context: Object, params: any) {
    return Buffer.from(params).toString('base64');
  }

  hashObject(context: Object, params: any) {
    return hash(params);
  }

  print(context: Object, params: any) {
    return console.log(`PRINT: ${JSON.stringify(params)}`);
  }

  logError(context: Object, params: any) {
    context.client.logger.error(JSON.stringify(params));
  }

  logInfo(context: Object, params: any) {
    context.client.logger.info(JSON.stringify(params));
  }

  jwtEncode(context: Object, params: any) {
    return jwt.encode(params.payload, params.secret, params.algorithm);
  }

}
module.exports = {
  FrameworkUtils
};
