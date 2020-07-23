// @flow
type Body =
  | void
  | {
      status: "success",
      data: {}
    }
  | {
      status: string,
      error: string
    };
type Response = { body: Body, ok: true } | { error: string, ok: false };

// $FlowFixMe
export default function handleResponseError({
  ok,
  error,
  body
}: Response): void | string {
  if (error) {
    return error;
  }
  if (!ok || !body) {
    return "Could not get a response from Phantombuster. API Down?";
  }
  if (body.status === "error") {
    return `Phantombuster returned an error code: ${body.error}`;
  }
  if (body.lastExitCode) {
    return "Last Agent launch didn't finish correctly, check status in Phantombuster";
  }
  return undefined;
}
