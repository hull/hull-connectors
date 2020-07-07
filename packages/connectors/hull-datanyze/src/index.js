const $ = require("jquery");

window.$ = $;

export default function boot() {
  $(() => {
    console.log("HIIIII.........");
  });
}

boot();
