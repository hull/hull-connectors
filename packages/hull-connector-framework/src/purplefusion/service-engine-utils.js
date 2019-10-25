/* flow... */

const BatchStream = require("batch-stream");
const csv = require('csv-stream');
const promisePipe = require("promisepipe");
const pumpPromise = require('pump-promise');

const devnull = require('dev-null');

const { Writable } = require("stream");
const uuid = require("uuid/v1");
const ps = require("promise-streams");
const map = require("through2-map");
const through2 = require("through2");

const HullVariableContext = require("./variable-context");
const { isUndefinedOrNull, parseIntOrDefault, setHullDataType, getHullDataType } = require("./utils");
const { uploadToS3 } = require("./s3");
const debug = require("debug")("hull-shared:stream-utils");

function startImportJob(context, url, partNumber, size, importId) {

  const importType = "users";
  const params = {
    url,
    format: "json",
    notify: false,
    emit_event: false,
    overwrite: true,
    name: `Import for ${context.connector.name}`,
    // scheduling all parts for right now.  Doesn't seem to work if schedule_at is removed
    // dashboard says "Invalid Date"
    schedule_at: moment().toISOString(),
    stats: { size },
    size,
    import_id: importId,
    part_number: partNumber
  };

  context.client.logger.info("incoming.job.progress", { jobName: "sync", stepName: "import", progress: partNumber, options: _.omit(params, "url"), type: importType });

  return context.client.post(`/import/${importType}`, params)
    .then(job => {
      return { job, partNumber };
    });
}

// Both promiseToWritableStrema and BatchStream need a highwatermark
// Batch stream because if it doesn't have one, it will buffer everything that comes in
// even though you can control the promiseToWritableStream with it's own watermark
// batch will still pull in everything (no default) until you die
// can control also at promiseToWritableStream, but a little confusing
// it's default highwatermark is 16, but with each batch being 100, it's processing 1600 messages in parallel
// so even if reducing highwatermark to 1 at batch, it's still processing a lot
// probably need ot set both down to 1 to process 100 at a time
function promiseToWritableStream(promise) {
  const writable = new Writable({
    objectMode: true,
    // removing the highwatermark for now because it doesn't make as much sense for incoming
    // where we're downloading something from a source that could be slow (marketo)
    // we don't want to give backpressure because it could cause the stream to fail
    highWaterMark: 1
  });

  writable._write = (chunk, encoding, callback) => {
    promise(chunk, encoding)
      .then(() => {
        callback();
      })
      .catch(error => {
        callback(error);
      });
  };

  return writable;

}


// Code originally from
// -- https://stackoverflow.com/questions/16010915/parsing-huge-logfiles-in-node-js-read-in-line-by-line
// Or possibly use: https://github.com/lbdremy/node-csv-stream

async function streamCsv(context: HullVariableContext, instruction: Object, param: any) {

  let inputParams = param;

  const options = {
    delimiter: ',', // default is ,
    endLine: '\n', // default is \n,
    escapeChar: '"', // default is an empty string
    enclosedChar: '"' // default is an empty string
  };

  const csvStream = csv.createStream(options);

  // removing the highwatermark for now because it doesn't make as much sense for incoming
  // where we're downloading something from a source that could be slow (marketo)
  // we don't want to give backpressure because it could cause the stream to fail
  // const batch = new BatchStream({ size: 200, highWaterMark: 2 });
  const batch = new BatchStream({ size: 10, highWaterMark: 2 });


  // TODO Below is some really ugly, hacky copy/paste code that streams to s3 and imports
  // really need to come back and clean this up
  // it ONLY works for users, and only if coming from a source stream
  // works decently for that case so far, but haven't hit many error cases yet
  const instructionOptions = instruction.options;
  const name = instructionOptions.name;
  const op = instructionOptions.op;
  const serviceDefinition = this.services[name];

  if (isUndefinedOrNull(serviceDefinition))
    throw new Error(`Undefined ServiceDefinition: ${name}<${op}>`);

  let endpoint = _.get(serviceDefinition, `endpoints.${op}`);

  if (!isUndefinedOrNull(endpoint) && endpoint.type === "stream") {
    const transform = map({ objectMode: true }, (object) => {

      setHullDataType(object, getHullDataType(inputParams));

      if (!isUndefinedOrNull(endpoint.input)) {
        return this.transforms.transform(context, object, endpoint.input);
      }
    });

    const batchSize = parseIntOrDefault(process.env.IMPORT_API_UPLOAD_BATCH_SIZE, 10000);
    const importId = uuid();
    let numBatches = 0;
    let numUsers = 0;

    let currentStream = null;
    let currentPromise;

    return pumpPromise(inputParams, csvStream, transform,
      through2({ objectMode: true, highWaterMark: 10 }, function rotate(user, enc, callback) {
        if (currentStream === null || numUsers % batchSize === 0) {

          numBatches += 1;
          if (currentStream) {
            currentStream.end();
            this.push(currentPromise);
          }

          const newUpload = uploadToS3(context.reqContext().connector.id, numBatches);
          currentStream = newUpload.stream;
          currentPromise = newUpload.promise;
        }

        // if (!currentPromise || numUsers % batchSize === 0) {
        //
        //   numBatches += 1;
        //   if (currentPromise) {
        //     this.push(currentPromise);
        //   }
        //   currentPromise = Promise.resolve({ url: "tim", partNumber: numBatches, size: 100 })
        // }

        const userString = JSON.stringify(user);
        numUsers += 1;
        if (numUsers % 1000 === 0) {
          debug(`Streamed users: ${numUsers}`);
        }
        // debug(`Streaming user: ${userString.substr(0, 60)}`);
        currentStream.write(`${userString}\n`);
        callback();
      }, function finish(callback) {
        debug(`Finished Streaming: ${numUsers}`);
        if (currentStream && currentStream.end) {
          // Readable does not implement end function,
          // so we need to be careful here.
          currentStream.end();
        }
        this.push(currentPromise);
        callback();
      }),
      ps.map({}, (result) => {

        debug(`Importing result: ${JSON.stringify(result)}`);
        if (!result) {
          return Promise.reject();
        }
        const { url, partNumber, size } = result;
        return startImportJob(context.reqContext(), url, partNumber, size, importId);
        // return Promise.resolve({});
      }),
      devnull({ objectMode: true})

    ).then((results) => {
      return Promise.resolve(results);
    }).catch((err) => {
      return Promise.reject(err);
    });
  }

  // using pumpPromise because the pump library is well maintained at 14mil weekly downloads
  // and the wrapper for it (pumpPromise) is very simple and it works
  return pumpPromise(inputParams.data, csvStream, batch, promiseToWritableStream((data) => {
    setHullDataType(data, getHullDataType(inputParams));
    return this.getResults(context, instruction, data);
  })).then((results) => {
    return Promise.resolve(results);
  }).catch((err) => {
    return Promise.reject(err);
  });

  // Not using promisePipe anymore because it is not detecting the end condition properly
  // I've debugged it, and seems like the resolve is being called 2x for the csvStream because
  // it has both close and finish called, but doesn't seem to be that weird
  // also superagent throws warnings that end is being called more than once which it doesn't support
  // either way, promise pipe doesn't seem to handle it well.  the pipe still runs, but doesn't return right
  // not that this was the problem but cleanupEventHandlers seemed a little weird, probably should have made it so resolve wasn't called 2x
  // get this: Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises
  // return promisePipe(inputParams.data, csvStream, batch, this.promiseToWritableStream((data) => {
  //   return this.getResults(context, instruction, new ServiceData(inputParams.classType, data));
  // }));

  // This was an attempt to debug this issue.
  // the following code worked and resolved the promise
  // return new Promise((resolve, reject) => {
  //   inputParams.data.on("error", err => {
  //     console.log("error download: " + JSON.stringify(err));
  //   }).on("end", err => {
  //     console.log("ending download: " + JSON.stringify(err));
  //   }).pipe(csvStream).on("error", err => {
  //     console.log("error csv: " + JSON.stringify(err));
  //   }).on("end", err => {
  //     console.log("ending csv: " + JSON.stringify(err));
  //   }).pipe(batch).on("error", err => {
  //     console.log("error batch: " + JSON.stringify(err));
  //   }).on("end", err => {
  //     console.log("ending batch: " + JSON.stringify(err));
  //   }).pipe(this.promiseToWritableStream((data) => {
  //     return this.getResults(context, instruction, new ServiceData(inputParams.classType, data));
  //   })).on("error", err => {
  //     console.log("error writable: " + JSON.stringify(err));
  //     reject();
  //   }).on("end", err => {
  //     console.log("ending writable: " + JSON.stringify(err));
  //   }).on("finish", err => {
  //     console.log("finish writable: " + JSON.stringify(err));
  //     resolve();
  //   })
  // });

}

module.exports = {
  streamCsv
};
