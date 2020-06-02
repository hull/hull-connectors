import type { HullManifest } from "../types/index";

const path = require("path");

const express = require("express");

function manifestRouteFactory(dirname) {
  return function manifestRoute(req, res) {
    return res.sendFile(path.resolve(dirname, "manifest.json"));
  };
}

function readmeRoute(req, res) {
  return res.redirect(
    `https://dashboard.hullapp.io/readme?url=https://${req.headers.host}`
  );
}

function staticRouter({ manifest }) {
  const { readme = "readme.md" } = manifest;
  const applicationDirectory = path.dirname(
    path.join(require.main.filename, "..")
  );
  const router = express.Router();

  router.use(express.static(`${applicationDirectory}/dist`));
  router.use(express.static(`${applicationDirectory}/assets`));

  router.get("/readme.md", (_req, res) => res.render(readme));
  router.get("/manifest.json", manifestRouteFactory(applicationDirectory));
  router.get("/", readmeRoute);
  router.get("/readme", readmeRoute);

  return router;
}

module.exports = staticRouter;
