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
    const arrayStrategy = transformation.arrayStrategy;

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
          } else if (transform.direction === "incoming") {
            mapping = [{ service: transform.inputPath, hull: transform.outputPath }];
          } else {
            mapping = [{ hull: transform.inputPath, service: transform.outputPath }];
          }

          _.forEach(mapping, mappedField => {

            // Should create something a little smarter to do local scope...
            // stack of contexts probably...
            const context = _.merge({}, globalContext)

            if (typeof mappedField === "string") {
              context.hull_field_name = mappedField;
              context.service_field_name = mappedField;
            } else {

              context.hull_field_name = mappedField.hull;

              if (!isUndefinedOrNull(mappedField.hull)) {
                if (_.startsWith(mappedField.hull, "traits_")) {
                  context.hull_field_name = mappedField.hull.substring("traits_".length);
                }
              }

              context.service_field_name = mappedField.service;
            }

            if (isUndefinedOrNull(transform.outputPath)) {
              throw new Error(`Unsupported transform, Must always have [outputPath] for transform: ${JSON.stringify(transform)}`);
            }

            // TODO here's a couple of auditable scenarios where we have to have these things
            if (!_.isEmpty(transform.inputPath)) {

              context.inputPath = doVariableReplacement(context, transform.inputPath);
              context.value = _.get(input, context.inputPath);

              // not sure if this is right or not, but we definitely specificied inputPath
              // so not sure if there's a case where we expect it to pull nothing...
              if (isUndefinedOrNull(context.value)) {
                debug(`Unable to find value at inputPath: ${context.inputPath} on input: ${JSON.stringify(input)}`);
                return;
              }

              if (Array.isArray(context.value)) {
                if (arrayStrategy === "json_stringify") {
                  context.value = JSON.stringify(context.value);
                } else if (arrayStrategy === "join_with_commas") {
                  context.value = context.value.join(",");
                }
              }
            }

            context.outputPath = doVariableReplacement(context, transform.outputPath);

            // TODO ugh, below code is horrible, i just needed to understand what the flow needed to be
            // gotta straighten this out now that I know...
            if (Array.isArray(context.value)) {
              // export type ArrayTransformationStrategy = "send_raw_array" | "append_index" | "json_stringify" | "join_with_commas";
              // if the value is still an array, must be one of these strategies...
              if (arrayStrategy === "send_raw_array") {

                if (_.isEmpty(transform.outputFormat)) {
                  _.set(output, context.outputPath, context.value);
                } else {
                  const valueArray = [];
                  _.forEach(context.value, (value, index) => {
                    valueArray.push(doVariableReplacement(
                      _.merge({ value: value }, context), transform.outputFormat));
                  });
                  _.set(output, context.outputPath, valueArray);
                }

              } else if (arrayStrategy === "append_index") {
                _.forEach(context.value, (value, index) => {

                  let finalValue = value;
                  if (!_.isEmpty(transform.outputFormat)) {
                    finalValue = doVariableReplacement(
                      _.merge({ value: value }, context), transform.outputFormat);
                  }
                  _.set(output,
                    `${context.outputPath.slice(0, -1)}_${index}`,
                    finalValue);
                });
              } else {
                // should not ever be here... other array strategies should
                // have condensed values to a single string
                throw new Error(`Unable to process array strategy ${arrayStrategy} on transform ${JSON.stringify(transform)}`);
              }
            } else if (!_.isEmpty(transform.outputFormat)) {
              // is ok if context.value is null here because outputformat is not
              context.value = doVariableReplacement(context, transform.outputFormat);
            }

            if (isUndefinedOrNull(context.value)) {
              throw new Error("Unable to get in this condition we think....");
            } else {
              _.set(output, context.outputPath, context.value);
            }

           //  else {
           //
           //   if (!_.isEmpty(transform.outputFormat)) {
           //     context.value = doVariableReplacement(context, transform.outputFormat);
           //   }
           //
           //   if (isUndefinedOrNull(context.value)) return;
           //
           //   _.set(output, context.outputPath, context.value);
           // }
          });
        });
      }

      return output;
    } else if (transformation.strategy === "PropertyKeyedGroup") {
      throw new Error(
        `Transformation Strategy ${
          transformation.strategy
        } not currently supported for transformation: ${JSON.stringify(transformation)}`
      );
    } else if (transformation.strategy === "ArrayPropertyGroup") {
      throw new Error(
        `Transformation Strategy ${
          transformation.strategy
        } not currently supported for transformation: ${JSON.stringify(transformation)}`
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
