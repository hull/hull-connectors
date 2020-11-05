/* @flow */
const { promiseToReadableStream } = require("hull/src/utils");

const ServiceClient = require("./service-client");

class ServiceClientBridge {
  serviceClient: ServiceClient;

  constructor(serviceClient: ServiceClient) {
    this.serviceClient = serviceClient;
  }

  getAllResponsesStream(formId: string) {
    return promiseToReadableStream(async push => {
      const getAllResponsesPage = async (token?: string) => {
        const response = await this.serviceClient.getResponses(formId, {
          before: token,
          completed: true
        });
        if (response.body.items && response.body.items.length > 0) {
          push(response.body.items);
          if (response.body.page_count > 1) {
            const lastToken = response.body.items.slice(-1)[0].token;
            return getAllResponsesPage(lastToken);
          }
        }
        return Promise.resolve();
      };
      return getAllResponsesPage();
    });
  }

  getRecentResponsesStream(formId: string, { since }: Object) {
    return promiseToReadableStream(async push => {
      const getRecentResponsesPage = async (token?: string) => {
        const response = await this.serviceClient.getResponses(formId, {
          before: token,
          since,
          completed: true
        });
        if (response.body.items && response.body.items.length > 0) {
          push(response.body.items);
          if (response.body.page_count > 1) {
            const lastToken = response.body.items.slice(-1)[0].token;
            return getRecentResponsesPage(lastToken);
          }
        }
        return Promise.resolve();
      };
      return getRecentResponsesPage();
    });
  }
}

module.exports = ServiceClientBridge;
