import { Transform } from "stream";

class BatchStream extends Transform {
  static make(options) {
    return new BatchStream(options);
  }

  constructor(options) {
    const opts = options || {};
    super(opts);

    const transformOptions = {
      objectMode: true
    };

    if (opts.highWaterMark !== undefined) {
      transformOptions.highWaterMark = opts.highWaterMark;
    }

    Transform.call(this, transformOptions);

    this.size = opts.size || 100;
    this.batch = [];
  }

  _transform(chunk, encoding, callback) {
    this.batch.push(chunk);
    if (this.batch.length >= this.size) {
      this.push(this.batch);
      this.batch = [];
    }
    callback();
  }

  _flush(callback) {
    if (this.batch.length) {
      this.push(this.batch);
      this.batch = [];
    }
    callback();
  }
}

export const batchStream = BatchStream.make;

export default BatchStream;
