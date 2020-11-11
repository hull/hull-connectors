export default async function handle({
  hull,
  private_settings,
  headers,
  body
}) {
  if (body.email) {
    hull.asUser({ email: body.email }).traits(body);
  }
  hull.logger.info("Foo", { body, private_settings, headers });
}
