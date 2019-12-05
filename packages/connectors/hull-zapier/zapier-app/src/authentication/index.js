module.exports = {
  type: "custom",
  fields: [
    { key: "token",
      label: "Token",
      required: true,
      type: "string",
      helpText: "This is found in your Zapier connector settings page in Hull."
    }
  ],
  test: {
    url: `${process.env.CONNECTOR_URL}/auth`
  }
};
