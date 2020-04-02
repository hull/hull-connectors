/* global describe, it */
import {
  expect
} from "chai";
import parseConnectionConfig from "../../server/lib/utils/parse-connection-config";

describe("Connection string util for MySQL and PostgreSQL", () => {
  it("should build the connectionString", () => {
    const private_settings = {
      db_type: "postgres",
      output_type: "s3",
      query: "SELECT * FROM users",
      db_host: "1.2.3.4",
      db_port: "5433",
      db_name: "hulldb",
      db_user: "hulluser",
      db_password: "hullpwd",
      db_options: "ssl=true",
      import_days: 10
    };

    const url = parseConnectionConfig(private_settings);
    expect(url).to.be.equal("postgres://hulluser:hullpwd@1.2.3.4:5433/hulldb?ssl=true");
  });

  it("should build the connectionString without options", () => {
    const private_settings = {
      db_type: "postgres",
      output_type: "s3",
      query: "SELECT * FROM users",
      db_host: "1.2.3.4",
      db_port: "5433",
      db_name: "hulldb",
      db_user: "hulluser",
      db_password: "hullpwd",
      import_days: 10
    };

    const url = parseConnectionConfig(private_settings);
    expect(url).to.be.equal("postgres://hulluser:hullpwd@1.2.3.4:5433/hulldb");
  });
});
