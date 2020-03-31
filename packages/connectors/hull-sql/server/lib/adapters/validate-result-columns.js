import _ from "lodash";

function isNotIn(collection) {
  return key => !_.includes(collection, key);
}

export default function validate(columnNames, import_type = "users") {
  const errors = [];
  switch (import_type) {
    case "users":
      if (["email", "external_id"].every(isNotIn(columnNames))) {
        errors.push("Column names should include email and/or external_id");
      }
      break;
    case "accounts":
      if (["domain", "external_id"].every(isNotIn(columnNames))) {
        errors.push("Column names should include domain and/or external_id");
      }
      break;
    case "events":
      if (["timestamp", "event"].some(isNotIn(columnNames)) || ["external_id", "email"].every(isNotIn(columnNames))) {
        errors.push("Column names should include event, timestamp and external_id or email");
      }
      break;
    default:
      break;
  }


  const incorrectColumnNames = [];
  _.forEach(columnNames, (column) => {
    if (column.includes(".") || column.includes("$")) {
      incorrectColumnNames.push(column);
    }
  });

  if (incorrectColumnNames.length > 0) {
    errors.push(`Following column names should not contain special characters ('$', '.') : ${incorrectColumnNames.join(", ")}`);
  }
  return { errors };
}
