/* @flow */
import type { HullContext } from "hull";

import type { ServiceTransforms } from "./types";

const { doVariableReplacement } = require("./utils");

const _ = require("lodash");

class TransformImpl {
  transforms: ServiceTransforms;

  constructor(transforms: ServiceTransforms) {
    this.transforms = transforms;
  }

  transform(reqContext: HullContext, input: Object, inputClass: Class<any>, outputClass: Class<any>) {
    const transformation = _.find(this.transforms, transform => {
      // find the transformation that outputs what this endpoint needs as input
      // TODO need to capture the concept of the type of class incoming
      // for now only 1 type....
      if (inputClass === transform.output) {
        return true;
      }
      return false;
    });

    if (transformation === undefined) {
      //throw new Error(`Transformation for ${inputClass} to: ${outputClass} not found`);
      console.log("Couldn't find transformation for: " + inputClass + " and " + outputClass);
      return input;
    }

    const globalContext = {};

    const maps = [
      "prospect_attributes_inbound",
      "prospect_attributes_outbound",
      "account_attributes_inbound",
      "account_attributes_inbound"
    ];

    _.forEach(maps, map => {
      _.set(
        globalContext,
        `settings.${map}`,
        _.get(reqContext, `connector.private_settings.${map}`)
      );
    });

    const template = transformation.template;

    if (transformation.strategy === "PropertyKeyedValue") {
      // Need this for transform back to hull
      const directTransformations = template.directmap;
      const output = {};

      if (!_.isEmpty(template.hard)) {
        _.merge(output, template.hard);
      }

      if (!_.isEmpty(directTransformations)) {
        _.forEach(directTransformations, (transformation) => {

          const context = _.merge({}, globalContext);
          const inputKey = doVariableReplacement(context, transformation.input);
          context.inKey = inputKey;

          const obj = _.get(input, inputKey);

          if (obj !== undefined) {
            context.value = obj;
            const outputKey = doVariableReplacement(context, transformation.output);
            _.set(output, outputKey, obj);
          }
        });
      }

      const keyedGroups = template.keyedGroups;
      if (!_.isEmpty(keyedGroups)) {
        _.forEach(keyedGroups, keyedGroup => {
          const arrayStrategy = keyedGroup.arrayStrategy;
          const inputPath = keyedGroup.input;
          const outputPath = keyedGroup.output;
          const outputKeyShape = keyedGroup.key;
          const outputValueShape = keyedGroup.value;
          const mapping = _.get(globalContext, keyedGroup.mapping);
          const inputAttributes = _.get(input, inputPath);

          _.forEach(mapping, mappedField => {
            const context = _.cloneDeep(globalContext);

            if (typeof mappedField === "string") {
              context.inKey = mappedField;
              context.outKey = outputKeyShape;
            } else {
              context.inKey = mappedField.input_field_name;
              context.outKey = mappedField.output_field_name;
            }

            context.value = _.get(inputAttributes, context.inKey);

            // TODO this is where we could put standard logic as to what to do to set/unset
            // values with undefined etc...
            if (context.value === undefined) return;

            if (Array.isArray(context.value)) {
              // if (arrayStrategy === "spreadindex") {
              // TODO maybe put an option for slicing plurals?
              // maybe don't always want that?
              _.forEach(context.value, (value, index) => {
                this.setValue(
                  context,
                  output,
                  outputPath,
                  `${context.outKey.slice(0, -1)}_${index}`,
                  outputValueShape,
                  value
                );
              });
              // }
            } else {
              this.setValue(
                context,
                output,
                outputPath,
                context.outKey,
                outputValueShape,
                context.value
              );
            }
          });
        });
      }

      return output;
    } else if (transformation.strategy === "PropertyKeyedGroup") {
      throw new Error(
        `Transformation Strategy ${
          transformation.strategy
        } not currently supported`
      );
    } else if (transformation.strategy === "ArrayPropertyGroup") {
      throw new Error(
        `Transformation Strategy ${
          transformation.strategy
        } not currently supported`
      );
    } else {
      throw new Error(
        `Transformation Strategy ${
          transformation.strategy
        } not found for transformation: ${JSON.stringify(transformation)}`
      );
    }
  }

  setValue(
    context: Object,
    output: Object,
    outputPath: string,
    outputKeyShape: string,
    outputValueShape: Object,
    outputValue: Object
  ) {
    if (outputValueShape !== undefined) {
      // TODO let's come back and refactor this in/out key madness
      // need to understand the spec...
      const outputGroup = {};
      _.forEach(outputValueShape, (value, key) => {
        _.set(
          outputGroup,
          doVariableReplacement(context, key),
          doVariableReplacement(context, value)
        );
      });

      _.set(
        output,
        `${outputPath}.${doVariableReplacement(context, outputKeyShape)}`,
        outputGroup
      );
    } else {
      _.set(
        output,
        `${outputPath}.${doVariableReplacement(context, outputKeyShape)}`,
        outputValue
      );
    }
  }

  /**
   * Normalizes the url by stripping everything
   * except hostname.
   *
   * @param {string} original The original url string.
   * @returns {string} The normalized url.
   * @memberof AttributesMapper
   */
  normalizeUrl(original: string): string {
    try {
      const closeUrl = new URL(original);
      return closeUrl.hostname;
    } catch (error) {
      return original;
    }
  }
}

module.exports = { TransformImpl };
