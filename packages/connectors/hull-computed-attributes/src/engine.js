// @flow

import ProcessorEngine from "hull-vm/src/processor-engine";

export default class ComputedAttributesEngine extends ProcessorEngine {
  updateData = (data: {}) => {
    try {
      this.updateParent(data);
      this.setState({
        ...data,
        error: undefined
      });
      const { fallbacks, locals } = this.getState();
      this.fetchPreview({
        fallbacks,
        locals,
        ...data
      });
    } catch (error) {
      this.setState({ error: `Invalid Update: ${error} ` });
    }
  };

  updateFallbacks = (fallbacks: {}) => this.updateData({ fallbacks });

  updateLocals = (locals: {}) => this.updateData({ locals });
}
