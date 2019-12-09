const _ = require("lodash");

module.exports = {
  configuration: {
    id: "5d51b4ebc07907e865025a7b",
    secret: "shhhhhh",
    organization: "organization.hullapp.io",
    hostname: "225ddbbc.connector.io",
    private_settings: {
      coppercrm_api_key: process.env.COPPER_API_KEY,
      coppercrm_email: process.env.COPPER_EMAIL,

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
      link_users_in_hull: false,
      synchronized_account_segments: [],
      link_users_in_service: true,
      token_expires_in: 7199,
      token_created_at: 1565635830,
      refresh_token: "refresh_token",
      access_token: "access_token",
      incoming_lead_attributes: [
        {
          hull: "coppercrm_lead/addressstreet",
          service: "addressStreet"
        },
        {
          hull: "coppercrm_lead/first_name",
          service: "first_name"
        },
        {
          hull: "coppercrm_lead/assigneeEmail",
          service: "assigneeEmail"
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
        op: "getUsers",
        input: undefined,
        result: {
          body: [{ id: 806394, name: "Tim Liu", email: "timliuhull2@gmail.com" }]
        }
      },
      {
        localContext: expect.anything(),
        name: "coppercrm",
        op: "getCustomerSources",
        input: undefined,
        result: {
          body: [
            { id: 1046842, name: "Advertising" },
            { id: 1046841, name: "Cold Call" },
            { id: 1046840, name: "Email" }
          ]
        }
      },
      {
        localContext: expect.anything(),
        name: "coppercrm",
        op: "fetchRecentLeads",
        input: undefined,
        result: {
          body:
            new Array(100).fill({ id: 50307894, first_name: "Samantha Summers (Sample - Try me!)", date_created: 1575663576, date_modified: 1575669574 })
        }
      },
      {
        localContext: expect.anything(),
        name: "coppercrm",
        op: "fetchRecentLeads",
        input: undefined,
        result: {
          body: [
            { id: 50307894, first_name: "Samantha Summers (Sample - Try me!)", date_created: 1575663576, date_modified: 1575669574 }
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
            operation: "set",
            value: "Samantha Summers (Sample - Try me!)"
          },
          "coppercrm_lead/id": { value: 50307894, operation: "set" }
        }
      },
      result: {}
    })
  ),
  result: expect.anything()
};
