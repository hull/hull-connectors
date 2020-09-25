// @flow

import ProcessorEngine from "hull-vm/src/processor-engine";

export default class ComputedAttributesEngine extends ProcessorEngine {
  updateData = (data: {}) => {
    try {
      this.setState({
        ...data,
        error: undefined
      });
      this.fetchPreview(this.getPreviewData(data));
      this.updateParent(data);
    } catch (error) {
      this.setState({ error: `Invalid Update: ${error} ` });
    }
  };

  getPreviewData = (data = {}) => {
    const { computedAttributes } = this.getState();
    return {
      computedAttributes,
      ...data
    };
  };

  getEntryData = () => {
    const { language, entity, search, computedAttributes } = this.state;
    return {
      language,
      entity,
      search,
      computedAttributes
    };
  };

  updateComputedAttributes = (computedAttributes: {}) =>
    this.updateData({ computedAttributes });
}
