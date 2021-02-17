// @flow

export type PrivateSettings = {
  url: string,
  code: string,
  throttle_rate: number,
  throttle_per_rate: number,
  concurrency: number,
  headers: Array<{ key: string, value: string }>,

  synchronized_segments: Array<string>,
  synchronized_events: Array<string>,
  synchronized_segments_leave: Array<string>,
  synchronized_segments_enter: Array<string>,
  synchronized_segments_whitelist: Array<string>,
  synchronized_segments_blacklist: Array<string>,
  synchronized_attributes: Array<string>
};
