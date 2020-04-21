const SSM = require("aws-sdk/clients/ssm");
const _ = require("lodash");
const ssm = new SSM({
  apiVersion: "2014-11-06",
  region: "us-east-1"
});

async function fetchParams(Path, parameters = {}, { NextToken = null, pageNum = 0, Recursive = false } = {}) {
  return new Promise((resolve, reject) => {
      return ssm.getParametersByPath({
        Path,
        NextToken,
        Recursive: false,
        WithDecryption: true
      }, (err, result) => {
        if (err) return reject(err);
        result.Parameters.map((p) => {
          const match = p.Name.match(/[0-9A-Z_-]+$/);
          const key = match && match[0];
          if (key && process.env[key] === undefined) {
            parameters[key] = p.Value;
          }
        });
        if (result.NextToken) {
          resolve(fetchParams(Path, parameters, { NextToken: result.NextToken, pageNum: pageNum + 1 }));
        } else {
          resolve(parameters);
        }
      });
    }
  )
}

function buildSSMPaths(ENV) {
  const {AWS_SSM_ENV_PATHS = "", MESOS_TASK_ID} = ENV;


  const ssm_paths = AWS_SSM_ENV_PATHS ? AWS_SSM_ENV_PATHS.split(",") : [];

  if (MESOS_TASK_ID) {
    const mesosTask = MESOS_TASK_ID.split(".")[0];
    const [environment, connectors, connectorName] = mesosTask.split("_");
    ssm_paths.push(`/${environment}/connectors/`);
    ssm_paths.push(`/${environment}/connectors/${connectorName}`);
  }

  return ssm_paths;
}

async function printSettings(paths) {
  for(const path of paths) {
    await fetchParams(path, {})
      .then(params => {
        console.log(`# loaded at ${Date.now()} from AWS_ACCESS_KEY=${process.env.AWS_ACCESS_KEY_ID} - SSM_PATH=${path}`);
        _.map(params, (v,k) => console.log(`export ${k}="${v}"`));
      })
      .catch(err => console.warn("# error loading SSM params: ", err.message));
  }
}


module.exports = { fetchParams, buildSSMPaths, printSettings };
