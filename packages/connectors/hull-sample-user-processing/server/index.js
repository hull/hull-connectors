export default async function handle({
  hull,
  user,
  segments,
  account,
  account_segments,
  changes,
  events,
  private_settings
}) {
  console.log({
    hull,
    user,
    segments,
    account,
    account_segments,
    changes,
    events,
    private_settings
  });
}
