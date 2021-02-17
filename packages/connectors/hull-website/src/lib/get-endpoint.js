const getEndpoint = ({ hull, deployment }) => {
  const scriptTag = document.querySelector("script[data-hull-endpoint]");
  let connectorId;
  let endpoint;
  if (hull && deployment) {
    const { ship: connector, platform } = deployment;
    if (platform) {
      connectorId = connector.id;
      endpoint = connector.source_url.replace(/\/$/, "");
    } else if (connector && connector.index) {
      const shipSource = document.createElement("a");
      shipSource.href = deployment.ship.index;
      if (shipSource.hash.match(/^#[a-z0-9]{24}$/)) {
        connectorId = shipSource.hash.substr(1);
        endpoint = shipSource.origin;
      }
    }
  } else if (scriptTag) {
    connectorId = scriptTag.getAttribute("data-hull-id");
    endpoint = scriptTag.getAttribute("data-hull-endpoint");
  }
  if (!connectorId || !endpoint) {
    return console.log(
      "Could not find ID or Endpoint on the Script tag. Did you copy/paste it correctly?"
    );
  }
  return { uri: `${endpoint}/${connectorId}`, connectorId };
};

export default getEndpoint;
