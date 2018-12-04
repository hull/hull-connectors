function migrateConnector(connector) {
  const outgoingUserAttributes = (
    connector.private_settings.sync_fields_to_mailchimp || []
  ).map(entry => {
    return {
      hull: entry.hull,
      service: entry.name,
      overwrite: entry.overwrite
    };
  });

  return {
    private_settings: {
      synchronized_user_segments:
        connector.private_settings.synchronized_segments,
      outgoing_user_attributes: outgoingUserAttributes
    }
  };
}

module.exports = migrateConnector;
