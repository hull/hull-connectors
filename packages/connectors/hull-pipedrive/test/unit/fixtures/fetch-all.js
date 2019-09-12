module.exports = {
  route: "fetchAll",
  configuration: {
    private_settings: {

    }
  },
  input: {},
  result: {},
  serviceRequests: [
    {
      localContext:expect.anything(),
      input: undefined,
      name: "pipedrive",
      op: "getAllPersonsPaged",
      result: [
        {
          id: 1,
          someattr: "tim"
        },
        {
          id: 2,
          someattr: "louis"
        }
      ]
    },
    {
      localContext:{},
      input: {
        ident: {
          anonymous_id: "pipedrive:1"
        },
        attributes: {
          "pipedrive/id": 1
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
          "pipedrive/id": 2
        }
      },
      name: "hull",
      op: "asUser",
      result: {}
    }
  ]
};
