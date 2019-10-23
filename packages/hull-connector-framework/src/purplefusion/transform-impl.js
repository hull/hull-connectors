/* @flow */
import type { HullContext } from "hull";

import type { ServiceTransforms } from "./types";

const HashMap = require('hashmap');
const jsonata = require("jsonata");

const HullVariableContext = require("./variable-context");
const transformationsShared = require("./transforms-shared");
const { performTransformation, toTransform } = require("../../src/purplefusion/transform-utils");

const {
  isUndefinedOrNull,
  removeTraitsPrefix,
  setHullDataType,
  getHullDataType,
  sameHullDataType,
  asyncForEach
} = require("./utils");

const debug = require("debug")("hull-shared:TransformImpl");

const _ = require("lodash");


class TransformImpl {

  transforms: ServiceTransforms;
  transformsMap: HashMap;
  unqualifiedDestinations: HashMap;


  constructor(transforms: ServiceTransforms) {
    this.transforms = _.concat(transforms, transformationsShared);
    this.transformsMap = new HashMap();
    this.unqualifiedDestinations = new HashMap();

    // Prime the map for lookups
    _.forEach(this.transforms, transform => {

      // add this type of transform to a special hashmap
      // not sure if we want to completely deprecate this in the future or not...
      // this means the user didn't define an input, could be dangerous
      if (isUndefinedOrNull(transform.input)) {
        let outputTransforms = this.unqualifiedDestinations.get(transform.output.service_name);
        if (isUndefinedOrNull(outputTransforms)) {
          outputTransforms = [];
          this.unqualifiedDestinations.set(transform.output.service_name, outputTransforms);
        }
        outputTransforms.push(transform);
        return;
      }


      let outputTransforms = this.transformsMap.get(transform.input.service_name);
      if (isUndefinedOrNull(outputTransforms)) {
        outputTransforms = [];
        this.transformsMap.set(transform.input.service_name, outputTransforms);
      }
      outputTransforms.push(transform);
    });
  }

  /**
   * Take the current transform map and try to find a sequence of transformations we can use
   * to get from the current object type to the destination type
   * @param visitedTransforms list of transforms we've visited so we don't get into a cycle
   * @param current
   * @param destination
   * @returns {null|Array}
   */
  findTransformPaths(visitedTransforms, current, destination) {

    if (isUndefinedOrNull(current))
      return null;

    let possibleTransforms = this.transformsMap.get(current.service_name);

    const foundTransforms = _.filter(possibleTransforms, { output: destination });

    if (foundTransforms.length > 0) {
      // found some transforms, don't go any deeper, won't find shorter paths
      const foundPaths = [];
      _.forEach(foundTransforms, transform => {
        const path = _.clone(visitedTransforms);
        path.push(transform);
        foundPaths.push(path);
      });

      return foundPaths;
    }

    // remove all possibilities where we've already been there
    // as in the output of this transformation was already an input at some point in our
    // list of visited transformations
    _.forEach(visitedTransforms, transform => {
      possibleTransforms = _.reject(possibleTransforms, { output: transform.input });
    });

    // transform from this to this shouldn't be an issue, but just in case
    possibleTransforms = _.reject(possibleTransforms, { output: current });

    if (possibleTransforms.length === 0) {
      // no possibilities found
      return null;
    }

    let foundPaths = [];

    _.forEach(possibleTransforms, transform => {
      visitedTransforms.push(transform);
       const paths = this.findTransformPaths(visitedTransforms, transform.output, destination);
       if (paths !== null) {
         foundPaths = _.concat(foundPaths, paths);
       }
      visitedTransforms.pop();
    });

    if (foundPaths.length === 0) {
      return null;
    }

    return foundPaths;
  }

  async transform(dispatcher, variableContext: HullVariableContext, input: Object, desiredOutputClass: any) {

    if (isUndefinedOrNull(input)) {
      return input;
    }

    if (isUndefinedOrNull(desiredOutputClass)) {
      return variableContext.resolveVariables(input);
    }

    const inputClass = getHullDataType(input);

    // cannot transform from the same input to same output, just return data
    if (inputClass && sameHullDataType(inputClass, desiredOutputClass)) {
      return input;
    }

    const possiblePaths = this.findTransformPaths([], inputClass, desiredOutputClass);

    if (isUndefinedOrNull(possiblePaths) || possiblePaths.length === 0) {

      // previous logic would have also taken a transformation if inputClass was null
      // for any given transformation that got to desiredOutputClass
      // now we only pick it if the input class for the transform was null...
      // probably best...
      const unqualifiedTransformations = this.unqualifiedDestinations.get(desiredOutputClass.service_name);

      if (!isUndefinedOrNull(unqualifiedTransformations) && unqualifiedTransformations.length > 0) {
        // take the first unqualified transformation if found
        return this.transformInput(variableContext, input, unqualifiedTransformations[0]);
      }

      debug(`No Transforms found from: ${inputClass} to ${desiredOutputClass}`);

      // TODO not sure if this is right... if we're looking to transform into another object, but can't
      // then maybe we should throw an error or something...
      // maybe not here? maybe validation error somewhere else?
      return input;

    }

    let transforms = null;

    _.forEach(possiblePaths, path => {
      if (transforms === null || path.length < transforms.length) {
        transforms = path;
      }
    });

    // loop through all the transforms to finally get the right data...
    let result = input;

    // for (let transformsI = 0; transformsI < transforms.length; transformsI += 1) {
    await asyncForEach(transforms, async (transform) => {
      // const transform = transforms[transformsI];
      let transformsToExecute = [transform];

      if (transform.strategy === "MixedTransforms") {
        transformsToExecute = transform.transforms;
      }

      // for (let transformsToExecuteI = 0; transformsToExecuteI < transformsToExecute.length; transformsToExecuteI += 1) {
      //   const executeTransform = transformsToExecute[transformsToExecuteI];
      await asyncForEach(transformsToExecute, async (executeTransform) => {

        // maybe depending on the transformation, break obj into multiple objects for array
        // or leave as is.... what should be the default?
        if (Array.isArray(result) && !executeTransform.batchTransform) {
          const nextResults = [];
          for (let resultI = 0; resultI < result.length; resultI += 1) {
            const nextResult = await this.transformInput(dispatcher, variableContext, result[resultI], executeTransform);
            nextResults.push(nextResult)
          }
          result = nextResults;
        } else {

          //if we're batch transforming an array, then we lose trackability here...
          // unless we go back in and resolve on user_claims (natural keys)
          // at batch endpoints we lose trackability as well, can't really say success...
          // unless reading back and can somehow do a natural key (or ordered) lookup/join
          result = await this.transformInput(dispatcher, variableContext, result, executeTransform);
        }

        debug("Transform: " + JSON.stringify(result));
      });

    });

    if (!isUndefinedOrNull(result)) {
      setHullDataType(result, desiredOutputClass);
    }
    // Can only return a hashmap of mapped objects if we didn't do any array based transforms
    // so not doing that should be the default...
    // though jsonata, kinda lends itself to full array transformations...
    return result;
  }

  preAttributeTransform(transformation, input) {
    const preAttributeTransformation = transformation.preAttributeTransform;

    if (preAttributeTransformation) {
      const result = _.cloneDeep(input);

      _.forEach(preAttributeTransformation, (attributeTransformation) => {
        const attributes = attributeTransformation.attributes;
        const attributeTransform = attributeTransformation.transform;

        if (attributes) {
          _.forEach(attributes, (attribute) => {
            let attributeValue = _.get(input, attribute);
            if (attributeValue) {
              if (typeof attributeTransform === 'function') {
                attributeValue = attributeTransform(attributeValue);
                _.set(result, attribute, attributeValue);
              }
            }
          });
        }
      });

      return result;
    }

    return input;
  }

  async transformInput(dispatcher, globalContext: HullVariableContext, input: Object, transformation: Object) {
    input = this.preAttributeTransform(transformation, input);

    const transforms = transformation.transforms;


    if (transformation.strategy === "AtomicReaction") {
      return await performTransformation(dispatcher, globalContext, input, transformation);
    } else if (transformation.strategy === "Jsonata") {
      let result = input;

      _.forEach(transforms, transform => {

        let doTransform = true;
        let jsonataExpression = transform;

        // TODO this conditional stuff is copy pasted, need to refactor
        // but probably should refactor a lot of this stuff
        // once the transformation abstraction becomes more clear
        if (_.isPlainObject(transform)) {
          doTransform = toTransform(transform, globalContext, input);
          jsonataExpression = transform.expression;
        }

        if (doTransform) {
          const expression = jsonata(jsonataExpression);
          // flattened context can be expensive, don't do it often...
          result = expression.evaluate(result, globalContext.createFlattenedContext());
        }

      });

      return result;
    } else if (transformation.strategy === "PropertyKeyedValue") {
      // Need this for transform back to hull
      const output = {};

      if (!_.isEmpty(transforms)) {
        _.forEach(transforms, transform => {

          const arrayStrategy = transform.arrayStrategy || transformation.arrayStrategy;

          let mapping;

          if (!_.isEmpty(transform.mapping)) {

            if (typeof transform.mapping === "string") {
              mapping = globalContext.get(transform.mapping);
            } else if (typeof transform.mapping.type === "string") {
              if (transform.mapping.type === "input") {
                if (typeof transform.mapping.path === "string") {
                  mapping = _.get(input, transform.mapping.path);
                } else {
                  mapping = input;
                }
              }
            }

            // if (_.isEmpty(mapping)) {
            //   debug(`Skipping mapping because does not exist for transform: ${JSON.stringify(transform)}`);
            // }
          } else if (transformation.direction === "incoming") {
            mapping = [
              { service: transform.inputPath, hull: transform.outputPath }
            ];
          } else {
            mapping = [
              { hull: transform.inputPath, service: transform.outputPath }
            ];
          }

          // not sure if this is exactly correct, but don't know what else it would be...
          if (typeof mapping === "string") {
            mapping = [
              { hull: mapping, service: mapping }
            ]
          }

          _.forEach(mapping, (value, key) => {
            const context = {};
            globalContext.pushNew(context);

            // I don't like this monster try/finally in order to ensure that globalContext is popped
            // maybe come up with another pattern like: globalContext.pushNew(context, () => {...
            // that executes function in context, then pops automatically...
            try {
              if (typeof key === "string") {
                context.hull_field_name = key;
                context.service_field_name = key;
              } else if (typeof value === "string" && isUndefinedOrNull(key)) {
                // I don't remember why we need this, please comment when you figure it out
                context.hull_field_name = value;
                context.service_field_name = value;
              } else {
                context.hull_field_name = removeTraitsPrefix(value.hull);
                context.service_field_name = value.service;
              }

              if (isUndefinedOrNull(transform.outputPath)) {
                throw new Error(`Unsupported transform, Must always have [outputPath] for transform: ${JSON.stringify(transform)}`);
              }

              // TODO here's a couple of auditable scenarios where we have to have these things
              if (!_.isEmpty(transform.inputPath)) {

                context.inputPath = globalContext.resolveVariables(transform.inputPath);
                context.value = _.get(input, context.inputPath);

                // add traits onto the possible field value, see if it resolves...
                if (isUndefinedOrNull(context.value)) {
                  const hull_field_name = context.hull_field_name;
                  context.hull_field_name = `traits_${hull_field_name}`;
                  context.inputPath = globalContext.resolveVariables(transform.inputPath);
                  context.value = _.get(input, context.inputPath);

                  // if no value, then return
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

              context.outputPath = globalContext.resolveVariables(transform.outputPath);

              if (isUndefinedOrNull(context.outputPath)) {
                throw new Error(`Bad variable replacment on outputPath, Must always have [outputPath] for transform: ${JSON.stringify(transform)}`);
              }

              if (!toTransform(transform, globalContext, input)) {
                return;
              }

              if (!isUndefinedOrNull(context.value) && !isUndefinedOrNull(transform.outputArrayFields)) {
                const fieldName = globalContext.get(transform.outputArrayFields.checkField);
                if (!isUndefinedOrNull(fieldName)
                  && transform.outputArrayFields.fields.indexOf(fieldName) >= 0) {
                  context.value = [context.value];
                  if (!isUndefinedOrNull(transform.outputArrayFields.mergeArrayFromContext)) {
                    const contextValue = globalContext.get(globalContext.resolveVariables(transform.outputArrayFields.mergeArrayFromContext));
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
                    _.forEach(context.value, (value) => {
                      const finalValue = globalContext.resolveVariables(transform.outputFormat, {value});
                      valueArray.push(finalValue);
                    });
                    _.set(output, context.outputPath, valueArray);
                  }

                } else if (arrayStrategy === "append_index") {
                  _.forEach(context.value, (value, index) => {

                    let finalValue = value;
                    if (!_.isEmpty(transform.outputFormat)) {
                      finalValue = globalContext.resolveVariables(transform.outputFormat, {value});
                    }

                    // if the word ends in s, remove create the non-pluralized form
                    let path = context.outputPath;
                    if (path[path.length - 1] === 's') {
                      path = context.outputPath.slice(0, -1);
                    }
                    _.set(output, `${path}_${index}`, finalValue);
                  });
                } else {
                  // should not ever be here... other array strategies should
                  // have condensed values to a single string
                  throw new Error(`Unable to process array strategy ${arrayStrategy} on transform ${JSON.stringify(transform)}`);
                }
              } else {

                if (!_.isEmpty(transform.outputFormat)) {
                  // is ok if context.value is null here because outputformat is not
                  context.value = globalContext.resolveVariables(transform.outputFormat);
                }

                if (!isUndefinedOrNull(context.value)) {

                  /* If the value belongs in an array of values in the json group:

                  In the transformation definition:
                  group: {
                    name: "properties",
                    type: "array"
                  },

                  const isGroupArray = transform.group && transform.group.name && transform.group.type === "array";

                  if (isGroupArray) {
                    let group = _.get(output, transform.group.name);
                    if (_.isNil(group)) {
                      group = [];
                    }
                    group.push(context.value);
                    _.set(output, context.outputPath, group);
                  } else {
                    _.set(output, context.outputPath, context.value);
                  }
                  */
                  _.set(output, context.outputPath, context.value);
                } else {
                  // can get to this point with output like this:
                  // { outputPath: "data.id", outputFormat: "${userId}" },
                  // where userId is not set, it's ok, just don't do anything...
                  //throw new Error("Unable to get in this condition we think....");
                }
              }
            } finally {
              globalContext.popLatest();
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
