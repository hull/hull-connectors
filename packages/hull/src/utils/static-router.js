// @flow

const path = require("path");

const express = require("express");

function readmeRoute(req, res) {
  return res.redirect(
    `https://dashboard.hullapp.io/readme?url=https://${req.headers.host}`
  );
}

function staticRouter({ manifest }) {
  const { readme = "readme.md" } = manifest;
  const applicationDirectory = path.join(process.cwd(), "..");
  const router = express.Router();

  router.use(express.static(`${applicationDirectory}/dist`));
  router.use(express.static(`${applicationDirectory}/assets`));

  router.get("/readme.md", (_req, res) => res.render(readme));
  router.get("/manifest.json", (req, res) => res.send(manifest));
  router.get("/", readmeRoute);
  router.get("/readme", readmeRoute);

  return router;
}

module.exports = staticRouter;
