module.exports = {
  type: "custom",
  fields: [{ key: "token", label: "Token", required: true, type: "string" }],
  test: {
    url: `${process.env.CONNECTOR_URL}/auth`
  }
};
