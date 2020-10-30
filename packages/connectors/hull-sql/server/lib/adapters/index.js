import * as postgres from "./postgres";
import * as mysql from "./mysql";
import * as s3 from "./s3";
import * as filesystem from "./filesystem";
import * as mssql from "./mssql";

const redshift = postgres;

export { mysql };
export { redshift };
export { postgres };
export { s3 };
export { filesystem };
export { mssql };
