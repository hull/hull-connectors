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
      this.fetchPreview(this.getPreviewData(data));
    } catch (error) {
      this.setState({ error: `Invalid Update: ${error} ` });
    }
  };

  getPreviewData = (data = {}) => {
    const { fallbacks, locals } = this.getState();
    return {
      fallbacks,
      locals,
      ...data
    };
  };

  getEntryData = () => {
    const {
      language,
      entity,
      selectedEvents,
      search,
      fallbacks,
      locals
    } = this.state;
    return {
      language,
      entity,
      search,
      fallbacks,
      locals,
      include: {
        events: {
          names: selectedEvents
        }
      }
    };
  };

  updateFallbacks = (fallbacks: {}) => this.updateData({ fallbacks });

  updateLocals = (locals: {}) => this.updateData({ locals });
}
