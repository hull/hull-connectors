import jQuery from "jquery";
import moment from "moment";
import onAuth from "../../../assets/js/opener-auth-complete";
import { fetchConfirm, fetchStarted } from "../../../assets/js/modal";

window.onAuth = onAuth;

const service = "Hubspot";
jQuery(function onStart($) {
  $("[data-href]").click(async function onClick() {
    const url = $(this).attr("data-href");
    const entity = $(this).attr("data-entity");
    const decision = await fetchConfirm({ entity, service });
    if (decision === "confirm") {
      $.post(url + window.location.search);
      fetchStarted({ entity, service });
    }
  });
});

jQuery(function timeData($) {
  const time = "<%=settings.last_fetch_started_at%>";
  if (time) {
    $("[data-time]").text(
      moment("<%=settings.last_fetch_started_at%>").format(
        "dddd[,] MMMM D [@] H[h]mm"
      )
    );
  }
});
