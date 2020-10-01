// @flow

import _ from "lodash";

const transformErrors = (
  errors: Array<{ message: string, schemaPath: string, name: string }>
) =>
  _.compact(
    errors.map(error => {
      console.log(error);
      if (
        error.name === "pattern" &&
        (error.schemaPath === "#/items/properties/target/pattern" ||
          error.schemaPath === "#/items/required")
      ) {
        return {
          ...error,
          message:
            "This needs to be a valid Attribute Name. Only letters, numbers, / _ and - are allowed"
        };
      }

      if (error.name === "required") {
        if (error.schemaPath === "#/items/required") {
          return {
            ...error,
            message: "You need to define a value here"
          };
        }
        if (error.params?.missingProperty === "value") {
          return {
            ...error,
            message: "Enter a default value"
          };
        }
        if (error.params?.missingProperty === "property") {
          return {
            ...error,
            message: "Pick an Attribute to lookup"
          };
        }
      }

      if (error.name === "stringOf") {
        return undefined;
      }

      return error;
    })
  );

export default transformErrors;
