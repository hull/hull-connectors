import swal from "sweetalert";

export const fetchConfirm = async ({
  entity,
  service,
  title = `Fetch all ${entity}`,
  text = `You are going to fetch all ${service} ${entity}. This will generate a significant amount of traffic. You should only do this once after installing the connector or if you want to re-import your entire database.`,
  type = "warning",
  icon = "warning",
  confirmText = "Start Fetching"
}) => {
  return swal({
    buttons: {
      cancel: "Cancel operation",
      confirm: {
        text: confirmText,
        value: "confirm"
      }
    },
    icon,
    title,
    text,
    type
  });
};

export const fetchStarted = async ({
  title = "Fetching Started",
  entity,
  service
}) => {
  swal({
    title,
    text: `The ${service} ${entity} will be fetched shortly.`,
    icon: "success"
  });
};
