import jQuery from "jquery";
import swal from "sweetalert";
import { fetchConfirm, fetchStarted } from "../../../assets/js/modal";
import onAuth from "../../../assets/js/opener-auth-complete";

window.onAuth = onAuth;

const service = "Outreach.io";
jQuery(function onStart($) {
  $("[data-href]").click(async function onClick() {
    const url = $(this).attr("data-href");
    const entity = url.indexOf("prospect") >= 0 ? "Prospects" : "Accounts";
    const decision = await fetchConfirm({ entity, service });
    if (decision === "confirm") {
      $.post(url + window.location.search);
      fetchStarted({ entity, service });
    }
  });
});
