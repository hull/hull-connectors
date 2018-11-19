/* @flow */
import type {
  HullAccountClaims,
  HullUserClaims,
  HullAccountAttributes,
  HullUserAttributes
} from "hull";

const _ = require("lodash");

class HullIncomingUser {
  ident: HullUserClaims;

  attributes: HullUserAttributes;

  accountIdent: HullAccountClaims;

  // shouldn't be able to set account traits from a user... right?
  // accountAttributes: HullAccountAttributes;

}

class HullOutgoingUser {
  //flat data struct with certain ident fields
  email: string;
  anonymous_ids: Array<String>;
  external_ids: Array<String>;
}

class HullIncomingAccount {
  ident: HullAccountClaims;
  attributes: HullAccountAttributes;
}

class HullOutgoingAccount {
  domain: string;
  anonymous_ids: Array<String>;
  external_ids: Array<String>;
}

module.exports = {
  HullIncomingUser,
  HullIncomingAccount,
  HullOutgoingUser,
  HullOutgoingAccount
};
