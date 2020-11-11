const manifest = () => ({
  version: "0.1.36-monorepo",
  tags: ["batch", "smart-notifier", "kraken-exports"],
  logo: "logo.png",
  picture: "picture.png",
  readme: "readme.md",
  private_settings: [
    {
      name: "synchronized_user_segments",
      title: "User Filter",
      description: "Which users are processed",
      type: "array",
      format: "segment",
      options: {
        standard: {
          ALL: "All Users"
        }
      },
      default: ["ALL"]
    }
  ],
  settings_sections: [
    {
      title: "Configuration",
      description: "Configure connector",
      properties: ["private_settings.synchronized_user_segments"]
    }
  ],
  json: [],
  subscriptions: [
    {
      url: "/smart-notifier",
      conditions: {
        channels: {
          only: ["user:update"]
        },
        segments: {
          "user:update": ["private_settings.synchronized_user_segments"]
        }
      },
      channels: [
        {
          channel: "user:update",
          handler: "userUpdate"
        }
      ]
    }
  ]
});

export default manifest;
