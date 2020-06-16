/* @flow */

const Promise = require("bluebird");
const _ = require("lodash");

const Connection = require("../../server/lib/service-client/connection");

export interface CreationResult {
  type: string;
  id: string;
}

function create(conn: Connection, resource: string, data: any[]): Promise<CreationResult[]> {
  return new Promise((resolve, reject) => {
    conn.sobject(resource).create(data, (err, rets) => {
      if (err) {
        console.error(err, rets);
        return reject(err);
      }
      const results = [];
      if (_.isArray(rets)) {
        _.forEach(rets, (ret) => {
          if (ret.success) {
            results.push({ type: resource, id: ret.id, data: ret });
          }
        });
      } else if (rets.success) {
        results.push({ type: resource, id: rets.id, data: rets });
      }
      return resolve(results);
    });
  });
}

function del(conn: Connection, resource: string, ids: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    conn.sobject(resource).del(ids, (err, rets) => {
      if (err) {
        console.error(err, rets);
        return reject(err);
      }
      const results = [];
      if (_.isArray(rets)) {
        _.forEach(rets, (ret) => {
          if (ret.success) {
            results.push(ret.id);
          }
        });
      } else if (rets.success) {
        results.push(rets.id);
      }
      return resolve(results);
    });
  });
}

module.exports = { create, del };
