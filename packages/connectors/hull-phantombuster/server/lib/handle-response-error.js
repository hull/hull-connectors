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
  if (error || !ok || !body || body.status === "error") {
    return error || body?.error || "Error when calling Phantombuster";
  }
  if (body.lastExitCode) {
    return "Last Agent launch didn't finish correctly, check status in Phantombuster";
  }
  return undefined;
}
