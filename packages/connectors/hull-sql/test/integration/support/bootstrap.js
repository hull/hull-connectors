import Hull from "hull";
import { Cache, Queue } from "hull/lib/infra";
import express from "express";
import Server from "../../../server/server";


export default function bootstrap(query, port, import_type = "users", insert_credentials = true) {
  const app = express();
  const cache = new Cache({
    store: "memory",
    ttl: 1
  });
  const queue = new Queue("bull", {
    prefix: process.env.KUE_PREFIX || "hull-sql",
    redis: process.env.REDIS_URL
  });

  const connector = new Hull.Connector({ port, cache, queue });
  const options = { connector, queue };
  connector.setupApp(app);

  if (insert_credentials) {
    app.use((req, res, next) => {
      // noinspection JSAnnotator
      req.hull = {
        ship: {
          private_settings: {
            import_type,
            db_type: "filesystem",
            output_type: "filesystem",
            query,
            db_host: "localhost",
            db_port: "5433",
            db_name: "hullsql",
            db_user: "hullsql",
            db_password: "hullsql"
          }
        },
        client: {
          post: () => Promise.resolve({}),
          put: () => Promise.resolve({}),
          logger: {
            info: () => {},
            debug: () => {},
            error: () => {},
            warn: () => {}
          }
        }
      };

      next();
    });
  }

  Server(app, options);
  connector.startApp(app);
}
