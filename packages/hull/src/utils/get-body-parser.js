// @flow
import express from "express";

export default function getBodyParser(parser: "json" | "urlencoded" | void) {
  if (parser === "json") {
    return express.json({ type: "*/*" });
  }
  if (parser === "urlencoded") {
    return express.urlencoded({ extended: true });
  }
  return undefined;
}
