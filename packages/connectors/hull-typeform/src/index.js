import jQuery from "jquery";
import { fetchConfirm, fetchStarted } from "../../../assets/js/modal";
import onAuth from "../../../assets/js/opener-auth-complete";

window.onAuth = onAuth;

const entity = "Form Submissions";
const service = "Typeform";

jQuery(function onStart($) {
  $("[data-href]").click(async function onClick() {
    const url = $(this).attr("data-href");
    const decision = await fetchConfirm({ entity, service });
    if (decision === "confirm") {
      $.post(url + window.location.search);
      fetchStarted({ entity, service });
    }
  });
});
