/* @flow */
import type {
  HullAccountClaims,
  HullUserClaims,
  HullAccountAttributes,
  HullUserAttributes
} from "hull";

const _ = require("lodash");

class HullServiceUser {
  ident: HullUserClaims;

  attributes: HullUserAttributes;

  accountIdent: HullAccountClaims;

  // shouldn't be able to set account traits from a user... right?
  // accountAttributes: HullAccountAttributes;

}

class HullServiceAccount {
  ident: HullAccountClaims;

  attributes: HullUserAttributes;

}

module.exports = {
  HullServiceUser,
  HullServiceAccount
};
