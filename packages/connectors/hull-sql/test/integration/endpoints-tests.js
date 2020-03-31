/* eslint-env node, mocha */

import assert from "assert";
import http from "http";
import fs from "fs";
import bootstrap from "./support/bootstrap";

describe("Server", () => {
  it("should return status OK on /run endpoint", (done) => {
    const query = "test/fixtures/query-data.json";
    const queryResult = "test/fixtures/query-data-result.json";
    const port = 8070;
    const postData = JSON.stringify({
      query
    });
    bootstrap(query, port);

    const requestOptions = {
      host: "localhost",
      port,
      method: "POST",
      path: "/run",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(requestOptions, (res) => {
      res.setEncoding("utf-8");
      assert(res.statusCode === 200);
      let respContent = "";

      res.on("data", chunk => {
        respContent += chunk.toString();
      });

      res.on("end", () => {
        const data = fs.readFileSync(queryResult, { encoding: "utf8" });
        assert(data.includes(JSON.stringify(JSON.parse(respContent).entries)));
        done();
      });
    });

    req.write(postData);
    req.end();
  });

  it("should return errors if result does not contain required column names for users import", (done) => {
    const port = 8077;
    const query = "test/fixtures/query-data-without-required-columns.json";
    bootstrap(query, port, "users");

    const postData = JSON.stringify({
      query
    });

    const requestOptions = {
      host: "localhost",
      port,
      method: "POST",
      path: "/run",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(requestOptions, (res) => {
      res.setEncoding("utf-8");
      assert(res.statusCode === 200);
      let respContent = "";

      res.on("data", chunk => {
        respContent += chunk.toString();
      });

      res.on("end", () => {
        assert.equal(JSON.parse(respContent).errors[0], "Column names should include email and/or external_id");
        done();
      });
    });

    req.write(postData);
    req.end();
  });

  it("should return errors if result does not contain required column names for events import", (done) => {
    const port = 8078;
    const query = "test/fixtures/query-events-data-without-required-columns.json";
    bootstrap(query, port, "events");

    const postData = JSON.stringify({
      query
    });

    const requestOptions = {
      host: "localhost",
      port,
      method: "POST",
      path: "/run",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(requestOptions, (res) => {
      res.setEncoding("utf-8");
      // console.log({ res });
      assert(res.statusCode === 200);
      let respContent = "";

      res.on("data", chunk => {
        respContent += chunk.toString();
      });

      res.on("end", () => {
        assert.equal(JSON.parse(respContent).errors[0], "Column names should include event, timestamp and external_id or email");
        done();
      });
    });

    req.write(postData);
    req.end();
  });

  it("should return errors if result contain invalid column names", (done) => {
    const port = 8072;
    const query = "test/fixtures/query-data-with-invalid-columns.json";
    bootstrap(query, port);

    const postData = JSON.stringify({
      query
    });

    const requestOptions = {
      host: "localhost",
      port,
      method: "POST",
      path: "/run",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(requestOptions, (res) => {
      res.setEncoding("utf-8");
      assert(res.statusCode === 200);
      let respContent = "";

      res.on("data", chunk => {
        respContent += chunk.toString();
      });

      res.on("end", () => {
        assert.equal(JSON.parse(respContent).errors[0], "Following column names should not contain special characters ('$', '.') : name.invalid");
        done();
      });
    });

    req.write(postData);
    req.end();
  });


  it("should return errors if postgres result contain json column", (done) => {
    process.env.POSTGRES_DATABASE_TEST = "true";
    const port = 8079;
    const query = "test/fixtures/postgres-query-data.json";
    bootstrap(query, port);

    const postData = JSON.stringify({
      query
    });

    const requestOptions = {
      host: "localhost",
      port,
      method: "POST",
      path: "/run",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(requestOptions, (res) => {
      res.setEncoding("utf-8");
      assert(res.statusCode === 200);
      let respContent = "";

      res.on("data", chunk => {
        respContent += chunk.toString();
      });

      res.on("end", () => {
        assert.equal(JSON.parse(respContent).errors[0], "Following columns from postgres database are in json format which is not supported : test");
        process.env.POSTGRES_DATABASE_TEST = "false";
        done();
      });
    });

    req.write(postData);
    req.end();
  });

  it("making sure we get to the right responses from the base path", (done) => {
    const port = 8090;
    bootstrap("", port, "users", false);

    const requestOptions = {
      host: "localhost",
      port,
      method: "GET",
      path: "/admin.html"
    };

    let admin = false;
    let readme = false;

    http.get(requestOptions, (res) => {
      assert(res.statusCode === 403);
      admin = true;
      if (admin && readme) {
        done();
      }
    });

    const requestOptionsReadme = {
      host: "localhost",
      port,
      method: "GET",
      path: "/readme"
    };

    http.get(requestOptionsReadme, (res) => {
      assert(res.statusCode === 302);
      readme = true;
      if (admin && readme) {
        done();
      }
    });
  });

  it("snowflake calls to make sure we get the right responses from the subpath", (done) => {
    const port = 8091;
    bootstrap("", port, "users", false);

    const requestOptions = {
      host: "localhost",
      port,
      method: "GET",
      path: "/snowflake/admin.html"
    };

    let admin = false;
    let readme = false;
    let bad = false;

    http.get(requestOptions, (res) => {
      assert(res.statusCode === 403);
      admin = true;
      if (admin && readme && bad) {
        done();
      }
    });

    const requestOptionsReadme = {
      host: "localhost",
      port,
      method: "GET",
      path: "/snowflake/readme"
    };

    http.get(requestOptionsReadme, (res) => {
      assert(res.statusCode === 302);
      readme = true;
      if (admin && readme && bad) {
        done();
      }
    });

    const requestOptionsBad = {
      host: "localhost",
      port,
      method: "GET",
      path: "/snowflake/asdf"
    };

    http.get(requestOptionsBad, (res) => {
      assert(res.statusCode === 404);
      bad = true;
      if (admin && readme && bad) {
        done();
      }
    });
  });


  it("should return status OK for /admin.html and status endpoint", (done) => {
    bootstrap("", 8092);

    let admin = false;
    let status = false;

    http.get("http://localhost:8092/admin.html", (res) => {
      assert(res.statusCode === 200);
      admin = true;
      if (admin && status) {
        done();
      }
    });

    http.get("http://localhost:8092/status", (res) => {
      assert(res.statusCode === 200);
      status = true;
      if (admin && status) {
        done();
      }
    });
  });
});
