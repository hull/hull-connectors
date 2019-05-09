// @noflow
// clone of https://github.com/howdyai/botkit/blob/dc0e780d3a50ffbfe89bc8f3908d1f8869d61466/lib/CoreBot.js
// with higher bodyParser limits to handle Smartnotifier's paylaods.
import bodyParser from "body-parser";
import express from "express";
import _ from "lodash";

export default function setupWebserver(botkit, port, cb) {
  if (!port) {
    throw new Error("Cannot start webserver without a port");
  }

  const static_dir =
    _.get(botkit, "config.webserver.static_dir") || `${process.cwd()}/public`;

  botkit.config.port = port;

  botkit.webserver = express();
  botkit.webserver.use(bodyParser.json({ limit: "100mb" }));
  botkit.webserver.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  botkit.webserver.use(express.static(static_dir));

  /* const server =  */
  botkit.webserver.listen(botkit.config.port, botkit.config.hostname, () => {
    botkit.log(`** Starting webserver on port ${botkit.config.port}`);
    if (cb) {
      cb(null, botkit.webserver);
    }
    botkit.trigger("webserver_up", [botkit.webserver]);
  });

  return botkit;
}
