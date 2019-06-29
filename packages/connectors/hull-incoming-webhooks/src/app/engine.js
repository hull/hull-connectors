// @flow
import RecentEntriesEngine from "hull-vm/src/recent-engine";
import type { Config, IncomingConfResponse /* , Entry*/ } from "hull-vm";

export default class IncomingWebhookEngine extends RecentEntriesEngine {
  constructor(config: Config) {
    super(config);
  }
}
