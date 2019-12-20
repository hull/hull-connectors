module.exports = {
  configuration: {
    id: "5c092905c36af496c700012e",
    secret: "shhh",
    organization: "organization.hullapp.io",
    hostname: "connectortest.connectordomain.io",
    private_settings: {
      flow_control_user_update_success_size: "100",
      flow_control_account_update_success_size: "100",
      activities_to_fetch: ["0", "897952", "897951", "897950"],
      coppercrm_api_key: "abcd",
      coppercrm_email: "tim@hully.com",
      deleteLeadWebhookId: 112876,
      deletePersonWebhookId: 112877,
      deleteCompanyWebhookId: 112948,
      deleteOpportunityWebhookId: 112949
    }
  },
  route: "fetchAllActivities",
  input: {},
  serviceRequests: [
    {
      localContext: expect.anything(),
      name: "coppercrm",
      op: "getUsers",
      result: {
        status: 200,
        body: [{ id: 806394, name: "Tim Liu", email: "timliuhull2@gmail.com" }]
      }
    },
    {
      localContext: expect.anything(),
      name: "coppercrm",
      op: "getActivityTypes",
      result: {
        status: 200,
        body: {
          user: [
            {
              id: 0,
              category: "user",
              name: "Note",
              is_disabled: false,
              count_as_interaction: false
            },
            {
              id: 897952,
              category: "user",
              name: "To Do",
              is_disabled: true,
              count_as_interaction: false
            },
            {
              id: 897951,
              category: "user",
              name: "Meeting",
              is_disabled: false,
              count_as_interaction: true
            },
            {
              id: 897950,
              category: "user",
              name: "Phone Call",
              is_disabled: false,
              count_as_interaction: true
            }
          ],
          system: [
            {
              id: 1,
              category: "system",
              name: "Property Changed",
              is_disabled: false,
              count_as_interaction: false
            },
            {
              id: 2,
              category: "system",
              name: "User Assigned",
              is_disabled: false,
              count_as_interaction: false
            },
            {
              id: 3,
              category: "system",
              name: "Pipeline Stage Changed",
              is_disabled: false,
              count_as_interaction: false
            },
            {
              id: 8,
              category: "system",
              name: "Entity Created",
              is_disabled: false,
              count_as_interaction: false
            },
            {
              id: 12,
              category: "system",
              name: "User Joined",
              is_disabled: false,
              count_as_interaction: false
            },
            {
              id: 6,
              category: "system",
              name: "Email",
              is_disabled: false,
              count_as_interaction: true
            }
          ]
        }
      }
    },
    {
      localContext: expect.anything(),
      name: "coppercrm",
      op: "fetchAllActivities",
      input: {
        activity_types: expect.arrayContaining([
          {
            id: 0,
            category: "user"
          },
          {
            id: 897952,
            category: "user"
          },
          {
            id: 897951,
            category: "user"
          },
          {
            id: 897950,
            category: "user"
          }
        ])
      },
      result: {
        status: 200,
        text:
          '[{"id":6311787861,"parent":{"id":92920636,"type":"person"},"type":{"id":0,"category":"user"},"user_id":806394,"details":"some note here","activity_date":1576771200,"old_value":null,"new_value":null,"date_created":1576779242,"date_modified":1576771200},{"id":6311783349,"parent":{"id":92920636,"type":"person"},"type":{"id":897950,"category":"user"},"user_id":806394,"details":"Made a phone call2","activity_date":1576782000,"old_value":null,"new_value":null,"date_created":1576779184,"date_modified":1576782000}]'
      }
    },
    {
      localContext: expect.anything(),
      name: "hull",
      op: "asUser",
      input: {
        ident: { anonymous_id: "coppercrm-person:person-92920636" },
        hull_events: [
          {
            context: { created_at: 1576771200, event_id: 6311787861 },
            properties: {
              details: "some note here",
              assigneeEmail: "timliuhull2@gmail.com"
            },
            eventName: "Note"
          }
        ]
      },
      result: {}
    },
    {
      localContext: expect.anything(),
      name: "hull",
      op: "asUser",
      input: {
        ident: { anonymous_id: "coppercrm-person:person-92920636" },
        hull_events: [
          {
            context: { created_at: 1576782000, event_id: 6311783349 },
            properties: {
              details: "Made a phone call2",
              assigneeEmail: "timliuhull2@gmail.com"
            },
            eventName: "Phone Call"
          }
        ]
      },
      result: {}
    }
  ],
  result: expect.anything()
};
