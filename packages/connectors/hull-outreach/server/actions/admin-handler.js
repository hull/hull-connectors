/* @flow */
import type { $Request, $Response } from "express";

function adminHandler(req: $Request, res: $Response) {
  res.render("home.html", {
    name: "Outreach.io"
  });
}

module.exports = adminHandler;
