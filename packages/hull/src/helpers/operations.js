// @flow
import type { HullContext } from "hull";

const setIfNull = (value: any) => ({ value, operation: "setIfNull" });
const increment = (value: number) => ({ value, operation: "increment" });
const decrement = (value: number) => ({ value, operation: "decrement" });

const operations = (_ctx: HullContext) => ({
  setIfNull,
  increment,
  decrement
});

module.exports = operations;
