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
  if (error || !ok || !body || body.status !== "success" || !body.data) {
    return error || body?.error || "Can't find data object in response";
  }
  return undefined;
}
