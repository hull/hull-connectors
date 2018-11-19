/* @flow */
import type { HullContext } from "hull";

import type { ServiceTransforms } from "./types";

const { doVariableReplacement } = require("./variable-utils");
const { isUndefinedOrNull } = require("./utils");

const debug = require("debug")("hull-shared:TransformImpl");

const _ = require("lodash");

class TransformImpl {
  transforms: ServiceTransforms;

  constructor(transforms: ServiceTransforms) {
    this.transforms = transforms;
  }

  transform(reqContext: HullContext, input: Object, inputClass: any, desiredInputClass: any) {

    if (isUndefinedOrNull(desiredInputClass)) {
      return doVariableReplacement(reqContext, input);
    }

    const transformation = _.find(this.transforms, transform => {
      // find the transformation that outputs what this endpoint needs as input
      // TODO need to capture the concept of the type of class incoming
      // for now only 1 type....
      if (isUndefinedOrNull(inputClass) || inputClass === transform.input) {
        if (desiredInputClass === transform.output) {
          return true;
        }
      }
      return false;
    });

    // here checking explicitly if undefined or null
    // otherwise flow throws errors later
    if (transformation === undefined || transformation === null) {
      if (isUndefinedOrNull(inputClass)) {
        debug(`Couldn't find transformation to: ${JSON.stringify(desiredInputClass)}`);
      } else {
        debug(`Couldn't find transformation for: ${JSON.stringify(inputClass)} and ${JSON.stringify(desiredInputClass)}`);
      }
      return input;
    }

    const globalContext = _.cloneDeep(reqContext);

    const transforms = transformation.transforms;

    if (transformation.strategy === "PropertyKeyedValue") {
      // Need this for transform back to hull
      const output = {};

      if (!_.isEmpty(transforms)) {
        _.forEach(transforms, transform => {

          let mapping;

          if (!_.isEmpty(transform.mapping)) {
            mapping = _.get(globalContext, transform.mapping);
            if (_.isEmpty(mapping)) {
              debug(`Skipping mapping: ${transform.mapping} because does not exist for transform: ${JSON.stringify(transform)}`);
            }
          } else {
            mapping = [{ input_field_name: transform.inputPath, output_field_name: transform.outputPath }];
          }

          _.forEach(mapping, mappedField => {

            // Should create something a little smarter to do local scope...
            // stack of contexts probably...
            const context = _.merge({}, globalContext)

            if (typeof mappedField === "string") {
              context.input_field_name = mappedField;
              context.output_field_name = mappedField;
            } else {
              context.input_field_name = mappedField.input_field_name;
              context.output_field_name = mappedField.output_field_name;
            }

            if (isUndefinedOrNull(transform.outputPath)) {
              throw new Error(`Unsupported transform, Must always have output path: ${JSON.stringify(transform)}`);
            }

            // TODO here's a couple of auditable scenarios where we have to have these things
            if (!_.isEmpty(transform.inputPath)) {

              context.inputPath = doVariableReplacement(context, transform.inputPath);
              context.value = _.get(input, context.inputPath);

              // not sure if this is right or not, but we definitely specificied inputPath
              // so not sure if there's a case where we expect it to pull nothing...
              if (isUndefinedOrNull(context.value)) return;

              // This could be a dangerous operation, because the original value is gone...
              // also, figure out how this abstracts for arrays...
              if (!_.isEmpty(transform.outputFormat)) {
                context.value = doVariableReplacement(context, transform.outputFormat);
              }

            } else if (!_.isEmpty(transform.outputFormat)) {

              //TODO may want to throw error os something here if variable replacement
              // can't find the var here.... this is for injecting context variables...
              // ******************NEED A SOLUTION********************
              context.value = doVariableReplacement(context, transform.outputFormat);
            } else {
              throw new Error(`Unsupported set of transformation parameters: ${JSON.stringify(transform)}`);
            }

            // TODO this is where we could put standard logic as to what to do to set/unset
            // values with undefined etc...
            if (isUndefinedOrNull(context.value)) return;

            context.outputPath = doVariableReplacement(context, transform.outputPath);

            if (Array.isArray(context.value)) {
              // if (arrayStrategy === "spreadindex") {
              // TODO maybe put an option for slicing plurals?
              // maybe don't always want that?
              _.forEach(context.value, (value, index) => {
                _.set(output,
                  `${context.outputPath.slice(0, -1)}_${index}`,
                  doVariableReplacement(context, value));
              });
              // }
            } else {
              _.set(output, context.outputPath, context.value);
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
