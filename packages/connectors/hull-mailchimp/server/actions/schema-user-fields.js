/* @flow */
import type { HullRequest } from "hull";
import type { $Response } from "express";

function schemaUserFields(req: HullRequest, res: $Response) {
  req.hull.shipApp.mailchimpAgent.getMergeFields().then(
    resBody => {
      res.json({
        options: resBody.merge_fields.map(f => {
          return { label: f.name, value: f.tag };
        })
      });
    },
    () => {
      res.json({ options: [] });
    }
  );
}

module.exports = schemaUserFields;
