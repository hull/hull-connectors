// @flow
import ProcessorEngine from "hull-vm/src/processor-engine";

import _ from "lodash";
import type { Config, Entry } from "hull-vm";

export default class UserProcessorEngine extends ProcessorEngine {
  constructor(config: Config) {
    super(config);
  }
}
