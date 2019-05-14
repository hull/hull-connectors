import jQuery from "jquery";
import swal from "sweetalert";
import onAuth from "../../../assets/js/opener-auth-complete";

window.onAuth = onAuth;

jQuery(function onStart($) {
  $("[data-href]").click(function onClick() {
    var url = $(this).attr('data-href');

    var titleVar, textVar, followupVar;
    if (url.indexOf("prospect") >= 0) {
      titleVar = "Fetch all Prospects";
      textVar = "You are going to fetch your Outreach.io Prospects. This can generate a lot of traffic. Are you sure?";
      followupVar = "The Prospects will be fetched shortly";
    } else {
      titleVar = "Fetch all Accounts";
      textVar = "You are going to fetch your Outreach.io Accounts. This can generate a lot of traffic. Are you sure?";
      followupVar = "The Accounts will be fetched shortly";
    }

    swal({
      title: titleVar,
      text: textVar,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, fetch all!",
      closeOnConfirm: false
    }, function onConfirm(isConfirm) {
      if (isConfirm) {
        $.post(url+window.location.search);
        swal("Fetching started", followupVar, "success");
      }
    });
  });
});
