/**
 * This is a workaround for using `@babel/register` withing packages of this
 * monorepo.
 * For example runnning `mocha -r babel-register` does not work, since
 * `@babel/register` cannot pick babel configuration from parent directory.
 * Instead use this file like this: `mocha -r ../../root-babel-register`.
 */
require("@babel/register")({
  cwd: __dirname
});
