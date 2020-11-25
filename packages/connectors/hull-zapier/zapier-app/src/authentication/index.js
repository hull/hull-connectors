module.exports = {
  type: "custom",
  fields: [
    { key: "token",
      label: "Token",
      required: true,
      type: "string",
      helpText: "This is found in your Zapier Connector settings page in Hull. Please refer to the Zapier Connector [documentation](https://www.hull.io/docs/connectors/zapier/) for more information."
    }
  ],
  test: {
    url: `${process.env.CONNECTOR_URL}/auth`
  }
};
