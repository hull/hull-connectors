// @flow
import {
  PhoneNumberFormat,
  PhoneNumberUtil,
  CountrySourceCode,
  PhoneNumberType
} from "google-libphonenumber";
// import type { HullContext } from "hull";
// import type { Result } from "../../types";

type PhoneNumberUtilType = {
  PhoneNumberUtil: any => any,
  PhoneNumberFormat: {}
};

const getPhoneNumberUtil = (): PhoneNumberUtilType => ({
  PhoneNumberUtil: PhoneNumberUtil.getInstance(),
  CountrySourceCode,
  PhoneNumberType,
  PhoneNumberFormat
});

export default getPhoneNumberUtil;
