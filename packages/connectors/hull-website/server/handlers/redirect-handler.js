// @flow

import Url from "url";

function validateUrl(url) {
  try {
    const result = Url.parse(url);
    return result.protocol && result.protocol.startsWith("http");
  } catch (err) {
    return false;
  }
}

export default (req, res) => {
  const link_url = req.query.url;
  if (!validateUrl(link_url)) {
    return res.status(400).json({ ok: false, error: "Invalid redirect URL" });
  }

  req.hull.track(
    "Redirect Link Clicked",
    {
      link_url,
      referrer: req.get("Referrer")
    },
    req.firehoseEventContext
  );

  return res.redirect(302, link_url);
};
