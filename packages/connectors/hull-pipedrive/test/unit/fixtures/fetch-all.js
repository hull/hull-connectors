module.exports = {
  route: "personFetchAll",
  configuration: {
    private_settings: {

    }
  },
  input: {},
  result: expect.anything(),
  serviceRequests: [
    {
      localContext:expect.anything(),
      input: undefined,
      name: "pipedrive",
      op: "getAllPersonsPaged",
      result: {
        body: {
          data: [
            {
              id: 1,
              someattr: "tim"
            },
            {
              id: 2,
              someattr: "louis"
            }
          ],
          additional_data: {
            pagination: {
              more_items_in_collection: false
            }
          }
        }
      },
    },
    {
      localContext: expect.anything(),
      input: {
        ident: {
          anonymous_id: "pipedrive:1"
        },
        attributes: {
          "pipedrive/id": {
            "operation": "set",
            "value": 1
          }
        }
      },
      name: "hull",
      op: "asUser",
      result: {}
    },
    {
      localContext: expect.anything(),
      input: {
        ident: {
          anonymous_id: "pipedrive:2"
        },
        attributes: {
          "pipedrive/id": {
            "operation": "set",
            "value": 2
          }
        }
      },
      name: "hull",
      op: "asUser",
      result: {}
    }
  ]
};
