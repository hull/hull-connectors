const manifest = () => ({
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
        "Paste the URL to external service in order to enable integration. Please refer to documentation for details.",
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
