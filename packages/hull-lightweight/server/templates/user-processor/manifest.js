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
    },
    {
      name: "variables",
      title: "Custom Variables",
      description:
        "Define custom variables here. usually things you don't want to save in the Connector's code, such as API Keys, or values you want to allow non-technical users to be able to update. A variable you define as `foo` Will be available as `variables.foo` in the code editor. Only Strings are supported here",
      type: "array",
      format: "table",
      items: {
        type: "object",
        properties: {
          key: {
            title: "Variable Name",
            placeholder: "Variable Name",
            type: "string",
            format: "string"
          },
          value: {
            title: "Value",
            placeholder: "Variable Value",
            type: "string",
            format: "string"
          }
        }
      },
      default: []
    }
  ],
  settings_sections: [
    {
      title: "Configuration",
      description: "Configure connector",
      properties: [
        "private_settings.synchronized_user_segments",
        "private_settings.variables"
      ]
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
