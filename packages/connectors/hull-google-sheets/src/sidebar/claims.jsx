// @flow

import React, { Fragment, Component } from "react";
import _ from "lodash";
import ClaimLine from "./claim-line";

import type { ClaimsType, ImportType, GoogleColumns } from "../../types";

const USER_CLAIMS = ["email", "external_id", "anonymous_id"];
const ACCOUNT_CLAIMS = ["domain", "external_id", "anonymous_id"];
const CLAIMS = {
  user: USER_CLAIMS,
  account: ACCOUNT_CLAIMS,
  user_event: USER_CLAIMS
};

type Props = {
  type?: ImportType,
  googleColumns?: GoogleColumns,
  claims?: ClaimsType,
  valid: boolean,
  onChangeRow: ClaimsType => void
};

type State = {};

const hasOnlyEmptyValues = (claims?: {}) =>
  claims ? _.every(claims, (v, k: string) => !k) : true;

class Claims extends Component<Props, State> {
  getValidClaims = (): Array<string> => {
    const { type = "user" } = this.props;
    return type === "user" || type === "user_event"
      ? USER_CLAIMS
      : ACCOUNT_CLAIMS;
  };

  render() {
    const { type = "user", googleColumns, claims } = this.props;
    return (
      <Fragment>
        <h4>Claims used to identify {type}</h4>
        {hasOnlyEmptyValues(claims) ? (
          <p className="error">
            You need to configure at least one claim to resolve {type}{" "}
            identities {type}
          </p>
        ) : null}

        <table className="full-width">
          <tbody>
            {CLAIMS[type].map((claim, i) => (
              <ClaimLine
                key={i}
                googleColumns={googleColumns}
                value={_.get(claims, claim)}
                claim={claim}
                onUpdate={this.props.onChangeRow}
              />
            ))}
          </tbody>
        </table>
      </Fragment>
    );
  }
}

export default Claims;
