import jQuery from "jquery";
import swal from "sweetalert";
import onAuth from "../../../assets/js/opener-auth-complete";

window.onAuth = onAuth;

jQuery(function onStart($) {
  $("[data-href]").click(function onClick() {
    const url = $(this).attr("data-href");
    swal(
      {
        title: "Fetch all form submissions",
        text: "You are going to fetch all form submissions. Are you sure?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, fetch all!",
        closeOnConfirm: false
      },
      function confirmed(isConfirm) {
        if (isConfirm) {
          $.post(url + window.location.search);
          swal(
            "Fetching started",
            "The form submissions will be fetched shortly.",
            "success"
          );
        }
      }
    );
  });
});
