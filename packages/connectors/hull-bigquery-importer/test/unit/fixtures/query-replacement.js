const moment = require("moment");

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
    moment("1993-06-19T12:05:18").utc().format("YYYY-MM-DDThh:mm:ss"),
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
