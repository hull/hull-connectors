const _ = require("lodash");

module.exports = {
  configuration: {
    id: "5d51b4ebc07907e865025a7b",
    secret: "shhhhhh",
    organization: "organization.hullapp.io",
    hostname: "225ddbbc.connector.io",
    private_settings: {
      // coppercrm_api_key: process.env.COPPER_API_KEY,
      // coppercrm_email: process.env.COPPER_EMAIL,
      coppercrm_api_key: "abcd",
      coppercrm_email: "tim@hully.com",
      lead_claims: [
        {
          hull: "email",
          service: "primaryEmail"
        }
      ],
      synchronized_lead_segments: [],
      account_claims: [
        {
          hull: "domain",
          service: "domain"
        }
      ],
      deleteLeadWebhookId: 112876,
      deletePersonWebhookId: 112877,
      deleteCompanyWebhookId: 112948,
      deleteOpportunityWebhookId: 112949,
      incoming_lead_attributes: [
        {
          hull: "coppercrm_lead/addressstreet",
          service: "addressStreet",
          overwrite: true
        },
        {
          hull: "coppercrm_lead/first_name",
          service: "first_name",
          overwrite: false
        },
        {
          hull: "coppercrm_lead/assigneeEmail",
          service: "assigneeEmail",
          overwrite: true
        }
      ]
    }
  },
  route: "fetchRecentLeads",
  input: expect.anything(),
  serviceRequests: _.concat([
      {
        localContext: expect.anything(),
        name: "coppercrm",
        op: "fetchRecentLeads",
        input: undefined,
        result: {
          body:
            new Array(100).fill({ id: 50307894, addressStreet: null, first_name: "Samantha Summers (Sample - Try me!)", date_created: 1575663576, date_modified: 1575669574 })
        }
      },
      {
        localContext: expect.anything(),
        name: "coppercrm",
        op: "fetchRecentLeads",
        input: undefined,
        result: {
          body: [
            { id: 50307894, addressStreet: null, first_name: "Samantha Summers (Sample - Try me!)", date_created: 1575663576, date_modified: 1575669574 }
          ],

        }
      }
    ],
    new Array(101).fill({
      localContext: expect.anything(),
      name: "hull",
      op: "asUser",
      input: {
        ident: {
          anonymous_id: "coppercrm-lead:lead-50307894"
        },
        attributes: {
          "coppercrm_lead/first_name": {
            operation: "setIfNull",
            value: "Samantha Summers (Sample - Try me!)"
          },
          "coppercrm_lead/addressstreet": {
            operation: "set",
            value: null
          },
          "coppercrm_lead/id": { value: 50307894, operation: "set" }
        }
      },
      result: {}
    }),
    [
      {
        name: "hull",
        op: "settingsUpdate",
        localContext: expect.anything(),
        input: {
          "last_fetchRecentLeads": 1575669574
        }
      }
    ]
  ),
  result: expect.anything()
};
