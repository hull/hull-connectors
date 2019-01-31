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
        debug(`Couldn't find transformation to: ${desiredInputClass}`);
      } else {
        debug(`Couldn't find transformation for: ${inputClass} and ${desiredInputClass}`);
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

          const arrayStrategy = transform.arrayStrategy || transformation.arrayStrategy;

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
            const context = _.assign({}, globalContext)

            if (typeof mappedField === "string") {
              context.hull_field_name = mappedField;
              context.service_field_name = mappedField;
            } else {

              context.hull_field_name = mappedField.hull;

              // UGH, remove traits from any field that has it
              // but with if we've mapped the traits and non-traits version
              // does this only apply to outgoing traffic?
              // i guess you could have mapped incoming to traits_?
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
                //debug(`Unable to find value at inputPath: ${context.inputPath} on input: ${JSON.stringify(input)}`);

                // TODO remove
                // Maybe pull the field with traits_...
                // backwards compatible... ugh...
                const hull_field_name = context.hull_field_name;
                context.hull_field_name = `traits_${hull_field_name}`;
                context.inputPath = doVariableReplacement(context, transform.inputPath);
                context.value = _.get(input, context.inputPath);

                if (isUndefinedOrNull(context.value)) {
                  return;
                }
              }

              if (Array.isArray(context.value)) {

                // TODO may need to validate the different behaviors here
                // if the array is empty (json stringify would return [] while others might set undefined
                if (arrayStrategy === "json_stringify") {
                  context.value = JSON.stringify(context.value);
                } else if (arrayStrategy === "join_with_commas") {
                  context.value = context.value.join(",");
                  if (_.isEmpty(context.value)) {
                    context.value = undefined;
                  }
                } else if (arrayStrategy === "pick_first") {
                  if (context.value.length > 0) {
                    context.value = context.value[0];
                  } else {
                    context.value = undefined;
                  }
                }
              }

            }

            context.outputPath = doVariableReplacement(context, transform.outputPath);

            if (isUndefinedOrNull(context.outputPath)) {
              throw new Error(`Bad variable replacment on outputPath, Must always have [outputPath] for transform: ${JSON.stringify(transform)}`);
            }

            if (transform.condition) {
              if (typeof transform.condition === 'string') {
                const value = _.get(context, transform.condition);

                if (isUndefinedOrNull(value)) {
                  return;
                } else if (typeof value === 'boolean' && !value) {
                  return;
                }
              } else if (typeof transform.condition === 'function') {
                if (!transform.condition(context)) {
                  return;
                }
              }
            }

            if (!isUndefinedOrNull(context.value) && !isUndefinedOrNull(transform.outputArrayFields)) {
              const fieldName = _.get(context, transform.outputArrayFields.checkField);
              if (!isUndefinedOrNull(fieldName)
                && transform.outputArrayFields.fields.indexOf(fieldName) >= 0) {
                  context.value = [context.value];
                if (!isUndefinedOrNull(transform.outputArrayFields.mergeArrayFromContext)) {
                  const contextValue = _.get(context, doVariableReplacement(context, transform.outputArrayFields.mergeArrayFromContext));
                  if (!isUndefinedOrNull(contextValue) && Array.isArray(contextValue)) {
                    _.forEach(contextValue, (value) => {
                      if (context.value.indexOf(value) < 0) {
                        //so we know that our value will come first
                        context.value.push(value);
                      }
                    });
                  }
                }
              }
            }

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
                      _.assign({}, context, { value: value }), transform.outputFormat));
                  });
                  _.set(output, context.outputPath, valueArray);
                }

              } else if (arrayStrategy === "append_index") {
                _.forEach(context.value, (value, index) => {

                  let finalValue = value;
                  if (!_.isEmpty(transform.outputFormat)) {
                    finalValue = doVariableReplacement(
                      _.assign({}, context, { value: value }), transform.outputFormat);
                  }

                  // if the word ends in s, remove create the non-pluralized form
                  let path = context.outputPath;
                  if (path[path.length -1] === 's') {
                    path = context.outputPath.slice(0, -1);
                  }
                  _.set(output,
                    `${path}_${index}`,
                    finalValue);
                });
              } else {
                // should not ever be here... other array strategies should
                // have condensed values to a single string
                throw new Error(`Unable to process array strategy ${arrayStrategy} on transform ${JSON.stringify(transform)}`);
              }
            } else {

              if (!_.isEmpty(transform.outputFormat)) {
                // is ok if context.value is null here because outputformat is not
                context.value = doVariableReplacement(context, transform.outputFormat);
              }

              if (!isUndefinedOrNull(context.value)) {
                _.set(output, context.outputPath, context.value);
              } else {
                // can get to this point with output like this:
                // { outputPath: "data.id", outputFormat: "${userId}" },
                // where userId is not set, it's ok, just don't do anything...
                //throw new Error("Unable to get in this condition we think....");
              }
            }

          });
        });
      }

      return output;
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
  // normalizeUrl(original: string): string {
  //   try {
  //     const closeUrl = new URL(original);
  //     return closeUrl.hostname;
  //   } catch (error) {
  //     return original;
  //   }
  // }
}

module.exports = { TransformImpl };
