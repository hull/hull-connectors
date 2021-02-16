import * as postgres from "hull-postgres-importer/server/lib/adapter";
import * as mysql from "hull-mysql-importer/server/lib/adapter";
import * as mssql from "hull-mssql-importer/server/lib/adapter";
import * as snowflake from "hull-snowflake-importer/server/lib/adapter";

const redshift = postgres;

export { mysql };
export { redshift };
export { postgres };
export { mssql };
export { snowflake };
