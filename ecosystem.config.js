module.exports = [
  {
    script: "dist/start.js",
    name: "app",
    exec_mode: "cluster",
    combine_logs: true,
    instances: process.env.WEB_CONCURRENCY,
    interpreter_args: process.env.NODE_ARGS
  }
];
