const manifest = () => ({
  tags: ["incoming"],
  logo: "logo.png",
  picture: "picture.png",
  readme: "readme.md",
  private_settings: [
    {
      name: "sync_interval",
      type: "number",
      title: "Pooling interval",
      description: "Interval in minutes at which to call external API.",
      default: 30,
      enum: [30, 60, 180, 360],
      required: true
    }
  ],
  settings_sections: [
    {
      title: "Configuration",
      description: "Configure connector",
      properties: ["private_settings.sync_interval", "json.manual_run"]
    }
  ],
  json: [
    {
      name: "manual_run",
      url: "/manual-run",
      format: "action",
      handler: "manualRun",
      title: "Manual run",
      options: {
        fireAndForget: true,
        confirm: {
          action: "fetch",
          text: "You are about to manually run this connector. Confirm?",
          button: "Run connecotor"
        }
      }
    }
  ],
  subscriptions: [],
  schedules: [
    {
      url: "/sync",
      type: "interval",
      handler: "scheduledCall",
      value_from: "private_settings.sync_interval",
      default: "30"
    }
  ]
});

export default manifest;
