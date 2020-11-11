import { Connector } from "hull";

export default async ({ path, type, manifest }) => {
  const { default: config } = await import(`${path}/server/config`);
  console.log(`Loading connector from ${path} on port ${process.env.PORT}`);
  return new Connector({
    manifest,
    ...(typeof config === "function" ? config() : config)
  }).start();
};
