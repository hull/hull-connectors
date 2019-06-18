/* eslint-disable */
/* global segment, Clipboard */
require("./clipboard.min.js");

const clipboard = new Clipboard("#copy");
const btn = new segment.EnableButton({
  element: "#segment-enable-button",
  integration: "hull",
  size: "large",
  settings: { apiKey: "<%= apiKey %>" }
});
btn.element.setAttribute("target", "_blank");
