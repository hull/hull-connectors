/* global describe, it */
import {
  expect
} from "chai";
import * as mssql from "../../server/lib/adapters/mssql";

describe("Connection string util for MSSQL", () => {
  it("should build the connectionString", () => {
    const private_settings = {
      db_type: "mssql",
      output_type: "s3",
      query: "SELECT * FROM users",
      db_host: "hullio.database.windows.net",
      db_port: "1433",
      db_name: "hulldb",
      db_user: "hulluser",
      db_password: "hullpwd",
      db_options: "{ \"encrypt\": true }",
      import_days: 10
    };

    const tediousOpts = mssql.parseConnectionConfig(private_settings);
    expect(tediousOpts.userName).to.be.equal(private_settings.db_user);
    expect(tediousOpts.password).to.be.equal(private_settings.db_password);
    expect(tediousOpts.server).to.be.equal(private_settings.db_host);
    expect(tediousOpts.options.encrypt).to.be.equal(true);
    expect(tediousOpts.options.port).to.be.equal(private_settings.db_port);
    expect(tediousOpts.options.database).to.be.equal(private_settings.db_name);
  });

  it("should build the connectionString without options", () => {
    const private_settings = {
      db_type: "mssql",
      output_type: "s3",
      query: "SELECT * FROM users",
      db_host: "hullio.database.windows.net",
      db_port: "1433",
      db_name: "hulldb",
      db_user: "hulluser",
      db_password: "hullpwd",
      import_days: 10
    };

    const tediousOpts = mssql.parseConnectionConfig(private_settings);
    expect(tediousOpts.userName).to.be.equal(private_settings.db_user);
    expect(tediousOpts.password).to.be.equal(private_settings.db_password);
    expect(tediousOpts.server).to.be.equal(private_settings.db_host);
    expect(tediousOpts.options.port).to.be.equal(private_settings.db_port);
    expect(tediousOpts.options.database).to.be.equal(private_settings.db_name);
  });
});
