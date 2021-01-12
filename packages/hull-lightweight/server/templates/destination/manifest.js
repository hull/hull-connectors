const manifest = () => ({
  tags: ["batch", "smart-notifier", "kraken-exports"],
  logo: "logo.png",
  picture: "picture.png",
  readme: "readme.md",
  private_settings: [
    {
      name: "synchronized_user_segments",
      title: "User Filter",
      description: "Pick segments of users that should be processed by this connector.",
      type: "array",
      format: "segment",
      options: {
        standard: {
          ALL: "All Users"
        }
      },
      default: []
    }
  ],
  settings_sections: [
    {
      title: "Outgoing User Filter",
      description: "Connector only works for users from segments whitelisted below.",
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
