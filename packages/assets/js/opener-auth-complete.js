function onAuthComplete() {
  // window.opener.hullAuthCompleted();
  window.close();
}
window.finish = onAuthComplete;

function reset() {
  window.location.href = window.location.href.replace("&reset=true", "");
}
function reload() {
  window.location.reload();
}

export default function onAuth(action) {
  if (action === "complete") {
    onAuthComplete();
  }
  if (action === "reset") {
    window.hullAuthCompleted = reset;
  }
  if (action === "reload") {
    window.hullAuthCompleted = reload;
  }
}
