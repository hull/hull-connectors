import $ from "jquery";
import onAuth from "../../../assets/js/opener-auth-complete";
import { fetchConfirm, fetchStarted } from "../../../assets/js/modal";

window.onAuth = onAuth;

$(function onStart() {
  $("[data-confirm]").click(async function onClick() {
    const listName = $(this).attr("data-confirm");
    const actionUrl = $(this).attr("data-action");
    const decision = await fetchConfirm({
      title: "Sync all users and segments",
      text: `You are going to resync Mailchimp with Hull. This will empty the list you picked (${listName}). This will remove all interest groups and static segments (possibly breaking any automation configuration) and can generate a lot of traffic. Are you sure?`,
      confirmText: "Start resync"
    });
    if (decision === "confirm") {
      $.post(actionUrl);
      fetchStarted({
        entity: listName,
        service: "Mailchimp List"
      });
    }
  });
});
