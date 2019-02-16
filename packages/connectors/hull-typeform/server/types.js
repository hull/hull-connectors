/* @flow */
import type { HullContextFull } from "hull";

export type TypeformResponseAnswer = {
  field: {
    id: string,
    type: string,
    ref: string
  },
  type:
    | "text"
    | "boolean"
    | "email"
    | "number"
    | "choices"
    | "choice"
    | "date"
    | "file_url",

  text?: string,
  boolean?: boolean,
  email?: string,
  number?: number,
  choice?: {
    label: string
  },
  choices?: {
    labels: Array<string>
  },
  date?: string,
  file_url?: string
};

export type TypeformResponse = {
  landing_id: string,
  token: string,
  landed_at: string,
  submitted_at: string,
  metadata: {
    user_agent: string,
    platform: string,
    referer: string,
    network_id: string,
    browser: string
  },
  answers: null | Array<TypeformResponseAnswer>,
  hidden: {
    [string]: string | boolean | number
  },
  calculated: {
    [string]: string | boolean | number
  }
};

export type TypeformFormMinimal = {
  id: string,
  title: string,
  last_updated_at: string
};

export type TypeformForm = {
  ...TypeformFormMinimal,
  language: string,
  fields: {
    id: string,
    ref: string,
    title: string,
    type: string,
    properties: Object
  },
  hidden: Array<string>
};

export type TypeformServiceClientOptions = {
  accessToken: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  client: $PropertyType<HullContextFull, "client">,
  metric: $PropertyType<HullContextFull, "metric">
};

export type TypeformConnectorPrivateSettings = Object;
