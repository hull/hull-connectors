/* @flow */

import type { HullContext } from "hull";
import type { IUserUpdateEnvelope } from "./types";

const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const JSONStream = require("JSONStream");
const tar = require("tar-stream");
const zlib = require("zlib");
const es = require("event-stream");
const _ = require("lodash");
const Promise = require("bluebird");

const { ConfigurationError, RateLimitError } = require("hull/src/errors");
const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin,
  superagentErrorPlugin
} = require("hull/src/utils");
const { md5 } = require("./util/utils");

class ServiceClient {
  agent: Object;

  client: Object;

  apiKey: string;

  domain: string;

  listId: string;

  constructor(ctx: HullContext) {
    const { connector, client, metric } = ctx;
    this.apiKey = _.get(connector, "private_settings.api_key");
    this.domain = _.get(connector, "private_settings.domain");
    this.listId = _.get(connector, "private_settings.mailchimp_list_id");
    this.client = client;
    // if (_.isEmpty(this.domain) || _.isEmpty(this.apiKey) || _.isEmpty(this.listId)) {
    //   throw new Error("Mailchimp access data not set!");
    // }
    this.agent = superagent
      .agent()
      .use(superagentErrorPlugin())
      .use(
        superagentUrlTemplatePlugin({
          listId: this.listId
        })
      )
      .use(
        superagentInstrumentationPlugin({ logger: this.client.logger, metric })
      )
      .use(prefixPlugin(`https://${this.domain}.api.mailchimp.com/3.0`))
      .set({ Authorization: `OAuth ${this.apiKey}` })
      .ok(res => {
        if (res.status === 401) {
          throw new ConfigurationError("Invalid API key");
        }
        if (res.status === 404) {
          if (res.req.path.match(/\/3\.0\/lists\/\w+\/webhooks/)) {
            throw new ConfigurationError("Mailchimp list is not present");
          }
          return true;
        }
        if (res.status === 429) {
          throw new RateLimitError("Rate limit error");
        }
        if (res.status < 500) {
          return true;
        }
        return false;
      })
      // .ok(res => res.status < 500 && res.status !== 429) // we reject the promise for 5xx and 429 status codes
      .timeout({ response: 50000 })
      .retry(2);
  }

  get(url: string) {
    return this.agent.get(url);
  }

  post(url: string) {
    return this.agent.post(url);
  }

  put(url: string) {
    return this.agent.put(url);
  }

  delete(url: string) {
    return this.agent.delete(url);
  }

  async getMemberInfo(email: string) {
    const subscriberHash = md5(email);
    const url = `/lists/${this.listId}/members/${subscriberHash}`;
    const member = await this.get(url);
    return member.body;
  }

  /**
   * Method to handle Mailchimp batch response as a JSON stream
   * @return {Stream}
   * @param response_body_url
   */
  handleResponse({ response_body_url }: Object) {
    const extract = tar.extract();
    const decoder = JSONStream.parse();

    extract.on("entry", (header, stream, callback) => {
      if (header.name.match(/\.json/)) {
        stream.pipe(
          decoder,
          { end: false }
        );
      }

      stream.on("end", () => callback()); // ready for next entry
      stream.on("error", () => callback()); // ready for next entry

      stream.resume();
    });

    extract.on("finish", () => decoder.end());
    extract.on("error", () => decoder.end());

    superagent(response_body_url)
      .pipe(zlib.createGunzip())
      .pipe(extract);

    /**
     * content of every file is
     * [
     *  {"status_code":200,"operation_id":"id","response":"encoded_json"},
     *  {"status_code":200,"operation_id":"id","response":"encoded_json"}
     * ]
     */
    return decoder.pipe(
      es.through(function write(data) {
        return data.map(r => this.emit("data", r));
      })
    );
  }

  handleError(err: Object) {
    // $FlowFixMe
    const filteredError = new Error(err.message, err.fileName, err.lineNumber); // eslint-disable-line flowtype-errors/show-errors
    // $FlowFixMe
    filteredError.extra = {
      // eslint-disable-line flowtype-errors/show-errors
      reqUrl: _.get(err, "response.request.url"),
      reqMethod: _.get(err, "response.request.method"),
      reqData: _.get(err, "response.request._data"),
      body: _.get(err, "response.body"),
      statusCode: _.get(err, "response.statusCode")
    };
    return filteredError;
  }

  exportCampaignSubscriberActivity() {
    return this.agent
      .get(
        `https://${this.domain}.api.mailchimp.com/export/1.0/campaignSubscriberActivity`
      )
      .query({
        apikey: this.apiKey,
        id: this.listId
        // status: "subscribed"
      });
  }

  /**
   * This method pass all `mailchimpNewMember` objects to this MC endpoint:
   * `POST /lists/{{listId}}`
   * and parsing results
   */
  upsertMembers(
    envelopes: Array<IUserUpdateEnvelope>
  ): Promise<IUserUpdateEnvelope[]> {
    const members = _.uniqBy(
      envelopes.map(envelope => envelope.mailchimpNewMember),
      "email_address"
    );
    if (members.length === 0) {
      return Promise.resolve(envelopes);
    }
    return this.agent
      .post("/lists/{{listId}}")
      .tmplVar({
        members: _.get(members, "length", 0)
      })
      .send({ members, update_existing: true })
      .then(({ body }) => {
        _.get(body, "errors", []).forEach(error => {
          const envelope = _.find(envelopes, {
            mailchimpNewMember: { email_address: error.email_address }
          });
          if (envelope) {
            if (
              error.error.match(
                "has signed up to a lot of lists very recently; we're not allowing more signups for now"
              ) ||
              error.error.match("Your merge fields were invalid.")
            ) {
              envelope.temporaryError = error.error;
            } else {
              envelope.permanentError = error.error;
            }
          }
        });
        envelopes.map(envelope => {
          envelope.mailchimpCurrentMember = _.omit(
            _.find(body.new_members, {
              email_address: envelope.mailchimpNewMember.email_address
            }) ||
              _.find(body.updated_members, {
                email_address: envelope.mailchimpNewMember.email_address
              }),
            "_links"
          );
          if (
            !envelope.mailchimpCurrentMember &&
            !_.isNil(envelope.permanentError) &&
            !_.isNil(envelope.temporaryError)
          ) {
            envelope.temporaryError =
              "User was not added to Mailchimp list correctly";
          }
          return envelope;
        });
        return envelopes;
      });
  }

  /**
   * This method goes over all `staticSegmentsToAdd` and `staticSegmentsToRemove` params from envelopes
   * and for each unique segment it issue a following call:
   * `POST /lists/{{listId}}/segments/{{staticSegmentId}}`
   * with `members_to_add` and `members_to_remove` params
   * @see https://developer.mailchimp.com/documentation/mailchimp/reference/lists/segments/#create-post_lists_list_id_segments_segment_id
   */
  updateStaticSegments(
    envelopes: Array<IUserUpdateEnvelope>
  ): Promise<IUserUpdateEnvelope[]> {
    const apiOperations = envelopes.reduce(
      (ops, envelope: IUserUpdateEnvelope) => {
        envelope.staticSegmentsToAdd.forEach(staticSegmentId => {
          ops = _.unionBy(
            ops,
            [{ staticSegmentId, envelopesToAdd: [], envelopesToRemove: [] }],
            "staticSegmentId"
          );
          const op = _.find(ops, { staticSegmentId });
          if (op) {
            op.envelopesToAdd.push(envelope);
          }
        });
        envelope.staticSegmentsToRemove.forEach(staticSegmentId => {
          ops = _.unionBy(
            ops,
            [{ staticSegmentId, envelopesToAdd: [], envelopesToRemove: [] }],
            "staticSegmentId"
          );
          const op = _.find(ops, { staticSegmentId });
          if (op) {
            op.envelopesToRemove.push(envelope);
          }
        });
        return ops;
      },
      []
    );

    return Promise.map(
      apiOperations,
      apiOperation => {
        const payload = {
          members_to_add: apiOperation.envelopesToAdd.map(
            envelope => envelope.mailchimpNewMember.email_address
          ),
          members_to_remove: apiOperation.envelopesToRemove.map(
            envelope => envelope.mailchimpNewMember.email_address
          )
        };
        return this.agent
          .post("/lists/{{listId}}/segments/{{staticSegmentId}}")
          .tmplVar({
            staticSegmentId: apiOperation.staticSegmentId,
            membersToAdd: _.get(payload, "members_to_add.length", 0),
            membersToRemove: _.get(payload, "members_to_remove.length", 0)
          })
          .send(payload)
          .then(response => {
            // if we have an error array, let's parse it
            _.get(response, "body.errors", []).forEach(error => {
              _.get(error, "email_addresses", []).forEach(emailAddress => {
                const envelope = _.find(envelopes, {
                  mailchimpNewMember: { email_address: emailAddress }
                });
                if (envelope) {
                  if (
                    !error.error.match(
                      "Email addresses do not exist in the static segment"
                    ) &&
                    !error.error.match(
                      "Email addresses already exist in the static segment"
                    )
                  ) {
                    envelope.temporaryError = error.error;
                  }
                }
              });
            });

            // envelopes.map((envelope) => {
            //   const emailAddress = envelope.mailchimpNewMember.email_address;
            //   if (!_.find(response.body.members_added, { email_address: emailAddress })
            //     && !_.find(response.body.members_removed, { email_address: emailAddress })) {
            //     envelope.temporaryError = "Email address was ignored from static segment change, it's probably is not subscribed to the Mailchimp list";
            //   }
            //   return envelope;
            // });
          });
      },
      {
        concurrency:
          parseInt(process.env.CONNECTOR_UPDATE_SEGMENT_CONCURRENCY, 10) || 7
      }
    ).then(() => envelopes);
  }
}

module.exports = ServiceClient;
