function migrateConnector(connector) {
  const outgoingUserAttributes = connector.private_settings.sync_fields_to_hubspot.map(
    entry => {
      return {
        hull: entry.hull,
        service: entry.name,
        overwrite: entry.overwrite
      };
    }
  );
  const incomingUserAttributes = connector.private_settings.sync_fields_to_hull.map(
    entry => {
      return {
        hull: entry.hull,
        service: entry.name
      };
    }
  );

  const outgoingAccountAttributes = (
    connector.private_settings.outgoing_account_attributes || []
  ).map(entry => {
    return {
      hull: entry.hull,
      service: entry.hubspot
    };
  });
  const incomingAccountAttributes = (
    connector.private_settings.incoming_account_attributes || []
  ).map(entry => {
    return {
      hull: entry.hull,
      service: entry.hubspot
    };
  });

  return {
    private_settings: {
      synchronized_user_segments:
        connector.private_settings.synchronized_segments,
      outgoing_user_attributes: outgoingUserAttributes,
      incoming_user_attributes: incomingUserAttributes,
      outgoing_account_attributes: outgoingAccountAttributes,
      incoming_account_attributes: incomingAccountAttributes
    }
  };
}

module.exports = migrateConnector;
