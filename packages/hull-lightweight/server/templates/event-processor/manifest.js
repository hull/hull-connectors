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
      name: "synchronized_event",
      title: "Event Filter",
      description: "Which event should be processed",
      type: "string",
      format: "event"
    },
    {
      name: "property_mapping",
      title: "Property Mapping",
      description: "List of Properties to save as Attributes",
      type: "array",
      format: "traitMapping",
      options: {
        loadOptions: "/schema/events",
        placeholder: "Event Property Name",
        direction: "incoming",
        showOverwriteToggle: true,
        allowCreate: true,
        autoFill: true
      }
    }
  ],
  settings_sections: [
    {
      title: "Configuration",
      description: "Configure connector",
      properties: [
        "private_settings.synchronized_user_segments",
        "private_settings.synchronized_event"
      ]
    },
    {
      title: "Configuration",
      description: "Configure Event Mapping",
      properties: ["private_settings.property_mapping"]
    }
  ],
  json: [
    {
      url: "/schema/events",
      handler: "getEventsSchema"
    }
  ],
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
