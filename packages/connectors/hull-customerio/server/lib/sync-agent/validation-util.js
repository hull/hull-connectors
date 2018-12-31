/* @flow */
import type {
  TCustomerIoCustomer,
  TBusinessValidationResult,
  IValidationUtilOptions
} from "../types";

const _ = require("lodash");

const SHARED_MESSAGES = require("../shared-messages");

class ValidationUtil {
  maxAttributeNameLength: number;

  maxAttributeValueLength: number;

  maxIdentifierValueLength: number;

  constructor(options: IValidationUtilOptions) {
    this.maxAttributeNameLength = _.get(options, "maxAttributeNameLength", 150);
    this.maxAttributeValueLength = _.get(
      options,
      "maxAttributeValueLength",
      1000
    );
    this.maxIdentifierValueLength = _.get(
      options,
      "maxIdentifierValueLength",
      150
    );
  }

  validateCustomer(customer: TCustomerIoCustomer): TBusinessValidationResult {
    const id = _.get(customer, "id");
    const validationResult: TBusinessValidationResult = {
      isValid: true,
      validationErrors: []
    };

    if (this.getBytes(id) > this.maxIdentifierValueLength) {
      validationResult.isValid = false;
      validationResult.validationErrors.push(
        SHARED_MESSAGES.ERROR_VALIDATION_MAXLENGTHID
      );
    }

    const attributes = _.omit(customer, "id");

    _.forIn(attributes, (val, key) => {
      if (this.getBytes(key) > this.maxAttributeNameLength) {
        validationResult.isValid = false;
        validationResult.validationErrors.push(
          `${SHARED_MESSAGES.ERROR_VALIDATION_MAXLENGTHNAME} '${key}'`
        );
      }

      if (_.isObject(val)) {
        // Gets stringified, so we need to get the length of the string
        const strVal = JSON.stringify(val);
        if (this.getBytes(strVal) > this.maxAttributeValueLength) {
          validationResult.isValid = false;
          validationResult.validationErrors.push(
            `${
              SHARED_MESSAGES.ERROR_VALIDATION_MAXLENGTHVALUE
            } '${strVal}' for attribute '${key}'`
          );
        }
      } else if (this.getBytes(val) > this.maxAttributeValueLength) {
        validationResult.isValid = false;
        validationResult.validationErrors.push(
          `${
            SHARED_MESSAGES.ERROR_VALIDATION_MAXLENGTHVALUE
          } '${val}' for attribute '${key}'`
        );
      }
    });

    return validationResult;
  }

  getBytes(value: string | null | void): number {
    if (_.isNil(value)) {
      return 0;
    }
    return Buffer.byteLength(_.toString(value), "utf-8");
  }
}

module.exports = ValidationUtil;
