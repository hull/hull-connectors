const manifest = () => ({
  version: "0.1.36-monorepo",
  tags: ["batch", "smart-notifier", "kraken-exports"],
  logo: "logo.png",
  picture: "picture.png",
  readme: "readme.md",
  incoming: [
    {
      url: "/webhooks/:connectorId/:token",
      handler: "incomingHandler",
      options: {
        bodyParser: "json"
      }
    }
  ],
  settings_sections: [
    {
      title: "Webhook URL",
      step: "credentials",
      description:
        "Send a POST request to the URL below to start capturing data, Then open the Code editor to write logic on how to ingest it",
      properties: ["json.credentials"]
    }
  ],
  json: [
    {
      url: "/url",
      name: "credentials",
      format: "credentials",
      title: "Webhook URL",
      description:
        "Set your external service to send POST webhooks to this url",
      handler: "credentialsHandler",
      options: {
        cacheContextFetch: false
      }
    }
  ]
});

export default manifest;
