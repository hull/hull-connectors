// @flow
/* global window */
import onAuth from "../../../assets/js/opener-auth-complete";

window.onAuth = onAuth;
//
// const reconnectButton = document.getElementById("reconnect_button");
// reconnectButton.addEventListener("click", function onClick(e) {
//   e.preventDefault();
//   e.stopPropagation();
//   window.location.href = `/connect?${window.location.href.split("?")[1]}`;
// });
