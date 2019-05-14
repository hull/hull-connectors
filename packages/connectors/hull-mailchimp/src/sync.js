import $ from "jquery";
import swal from "sweetalert";
import onAuth from "../../../assets/js/opener-auth-complete";

window.onAuth = onAuth;

$(function onStart() {
  $("[data-confirm]").click(function onClick() {
    const listName = $(this).attr("data-confirm");
    const actionUrl = $(this).attr("data-action");
    swal(
      {
        title: "Sync all users and segments",
        text: `You are going to resync Mailchimp with Hull. This will empty the list you picked (${listName}). This will remove all interest groups and static segments (possibly breaking any automation configuration) and can generate a lot of traffic. Are you sure?`,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, sync it!",
        closeOnConfirm: false
      },
      function onConfirm(isConfirm) {
        if (isConfirm) {
          $.post(actionUrl);
          swal(
            "Sync started",
            `The Mailchimp list (${listName}) will be synced shortly.`,
            "success"
          );
        }
      }
    );
  });
});
