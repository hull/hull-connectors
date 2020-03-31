import repl from "repl";
import vm from "vm";
import enrichContext from "./lib/enrich-context";
import getHullContext from "./lib/get-hull-context";

export default async function getRepl({ credentials, middlewares }) {
  const replServer = repl.start({
    prompt: "hull > ",
    useColors: true,
    terminal: true,
    eval(cmd, context, filename, callback) {
      const result = vm.runInContext(cmd, context);
      if (result && result.then instanceof Function) {
        return result.then(
          res => callback(null, res),
          err => callback(null, err)
        );
      }
      return callback(null, result);
    }
  });

  const { context } = replServer;
  const ctx = await getHullContext({ credentials, middlewares });
  await enrichContext({ ctx, credentials, context });

  replServer.on("exit", () => process.exit());
  replServer.on("reset", async function onReset(newctx) {
    await enrichContext({ ctx, credentials, context: newctx });
    this.displayPrompt();
  });
  replServer.displayPrompt();
}
