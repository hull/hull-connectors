const faker = require("faker");
const fs = require("fs");
const ImportS3Stream = require("hull/src/utils/import-s3-stream");
const promisePipe = require("promisepipe");
const AWS = require("aws-sdk");
const JSONStream = require("JSONStream");

function fakeUsers(filename, count) {
  fs.writeFileSync(filename, "");
  for (let i = 0; i < count; i += 1) {
    fs.appendFileSync(
      filename,
      `{ "userId": "${i}", "traits" : { "email": "${faker.internet
        .email()
        .toLowerCase()}", "first_name" : "${faker.name.firstName()}", "last_name": "${faker.name.lastName()}", "hull_repl_import": true } }\n`
    );
  }
}

function fakeAccounts(filename, count, additionalTraits = {}) {
  fs.writeFileSync(filename, "");
  for (let i = 0; i < count; i += 1) {
    const account = {
      accountId: faker.random.uuid(),
      traits: {
        domain: faker.internet.domainName().toLowerCase(),
        name: faker.company.companyName(),
        hull_repl_generated_at: new Date().toString(),
        ...additionalTraits
      }
    };
    fs.appendFileSync(filename, `${JSON.stringify(account)}\n`);
  }
}

function importFile(
  filename,
  { importType = "users", notify = false, emitEvent = false } = {}
) {
  const readableStream = fs.createReadStream(filename, { encoding: "utf-8" });
  const jsonDecoder = JSONStream.parse();
  const importStream = new ImportS3Stream(
    {
      hullClient: this.ctx.client,
      s3: new AWS.S3()
    },
    {
      s3Bucket: process.env.AWS_S3_BUCKET,
      notify,
      emitEvent,
      importType,
      s3KeyTemplate: "hullrepl/<%= partIndex %>.json"
    }
  );

  return promisePipe(readableStream, jsonDecoder, importStream).then(
    streams => {
      return streams[2].importResults;
    }
  );
}

module.exports = {
  fakeUsers,
  fakeAccounts,
  importFile
};
