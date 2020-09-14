// @flow

import ProcessorEngine from "hull-vm/src/processor-engine";

export default class ComputedAttributesEngine extends ProcessorEngine {
  updateFallbacks = (fallbacks: string) => {
    try {
      this.updateParent({ fallbacks });
      const { code } = this.getState();
      this.setState({
        fallbacks,
        error: undefined
      });
      this.fetchPreview({
        code,
        fallbacks
      });
    } catch (err) {
      console.log("Couldn't update Fallbacks", err);
      this.setState({
        error: `Invalid Fallbacks data object: ${err}`
      });
    }
  };
}
