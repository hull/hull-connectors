const {
  ifL,
  cond,
  settings,
  Svc
} = require("hull-connector-framework/src/purplefusion/language");

function bigquery(op: string, param?: any): Svc {
  return new Svc({ name: "bigquery", op }, param);
}

const glue = {
  status: ifL(cond("notEmpty", settings("access_token")), {
    do: {
      status: "ok"
    },
    eldo: {
      status: "setupRquired",
      message: "Connector not authenticated"
    }
  })
};

module.exports = glue;
