/* global document */

export default function queryParams(search) {
  return (search || document.location.search)
    .slice(1)
    .split("&")
    .reduce((q, p) => {
      const r = p.split("=");
      q[r[0]] = r[1];
      return q;
    }, {});
}
