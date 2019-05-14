import jQuery from "jquery";
import swal from "sweetalert";
import moment from "moment";
import onAuth from "../../../assets/js/opener-auth-complete";

window.onAuth = onAuth;

jQuery(function onLoad($) {
  $("[data-href]").click(function onClick() {
    const url = $(this).attr("data-href");
    const entity = $(this).attr("data-entity");
    swal(
      {
        title: `Fetch all ${entity}`,
        text: `You are going to fetch all Hubspot ${entity}. This will generate an important amount traffic. You should do this once when after installing the connector or if you want to re-import your entire database. Continue?`,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0093E6",
        confirmButtonText: "Continue",
        closeOnConfirm: false
      },
      function swalConfirm(isConfirm) {
        if (isConfirm) {
          $.post(url + window.location.search);
          swal(
            "Fetching started",
            `The Hubspot ${entity} will be fetched shortly.`,
            "success"
          );
        }
      }
    );
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
