const Router = require("express").Router;

/**
 * This is an [Express](https://expressjs.com/) router which applies to internal MiniHull
 * http server special endpoint for `mimic*` methods which serve content from internal database (`db` param).
 * This router is applied to every MiniHull instance in it's constructor
 *
 * @param  {Object} minihull Minihull instance
 * @return {Router}          Express router
 */
module.exports = function router(minihull) {
  const hullRouter = new Router();
  hullRouter.get("/", (req, res) => {
    res.json({
      id: "minihull",
      name: "minihull",
      domain: minihull.getOrgAddr()
    });
  });

  hullRouter.get("/segments", (req, res) => {
    res.json(minihull.db.get("segments").value());
  });

  hullRouter.get("/app", (req, res) => {
    res.json(
      minihull.db
        .get("connectors")
        .find({ id: req.header("Hull-App-Id") })
        .value()
    );
  });

  hullRouter.put("/app", (req, res) => {
    minihull.db
      .get("connectors")
      .find({ id: req.header("Hull-App-Id") })
      .set("private_settings", req.body.private_settings)
      .write();
    res.json(
      minihull.db
        .get("connectors")
        .find({ id: req.header("Hull-App-Id") })
        .value()
    );
  });

  hullRouter.get("/:id", (req, res) => {
    const connector = minihull.db
      .get("connectors")
      .find({ id: req.params.id })
      .value();
    const segment = minihull.db
      .get("segments")
      .find({ id: req.params.id })
      .value();
    res.json(connector || segment);
  });

  hullRouter.put("/:id", (req, res) => {
    minihull.db
      .get("connectors")
      .find({ id: req.header("Hull-App-Id") })
      .set("private_settings", req.body.private_settings)
      .write();
    res.json(minihull.db.get("connectors").find({ id: req.params.id }));
  });

  hullRouter.post("/firehose", (req, res) => {
    res.end("ok");
  });

  hullRouter.post("/extract/user_reports", (req, res) => {
    res.end("ok");
  });

  hullRouter.get("/search/user_reports/bootstrap", (req, res) => {
    res.json({
      tree: [
        {
          text: "User",
          children: [
            { id: "id", text: "Hull ID", type: "string" },
            { id: "email", text: "Email", type: "string", default: null }
          ]
        }
      ]
    });
  });

  return hullRouter;
};
