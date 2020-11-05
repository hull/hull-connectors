module.exports = {
  route: "variableReplacement",
  configuration: {
    private_settings: {
      import_type: "users",
      last_sync_at: "1993-06-19T12:05:18"
    }
  },
  input: {},
  result: [
    "1993-06-19T10:05:18",
    "",
    expect.anything(),
    ""
  ],
  serviceRequests: [
    {
      localContext: {
        formattedQuery: ":last_sync_at > 123"
      }
    }
  ]
}
