/* @flow */
import { Request, Response } from "express";
import Promise from "bluebird";

export default function admin(req: Request, res: Response) {
  const { typeformClient } = req.shipApp;

  (() => {
    if (
      !req.hull.ship.private_settings.typeform_uid ||
      !typeformClient.ifConfigured()
    ) {
      return Promise.resolve(null);
    }
    const typeformUid = req.hull.ship.private_settings.typeform_uid;
    return typeformClient
      .get(`/form/${typeformUid}`)
      .query({
        limit: 1
      })
      .then(({ body }) => {
        return body.stats.responses.completed;
      })
      .catch(() => {
        return 0;
      });
  })().then(completed => {
    return res.render("admin.html", { query: req.query, completed });
  });
}
