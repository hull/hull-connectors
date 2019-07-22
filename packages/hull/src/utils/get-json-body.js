// @flow
export default function get(body: mixed): Object {
  return body !== null && typeof body === "object" ? body : {};
}
