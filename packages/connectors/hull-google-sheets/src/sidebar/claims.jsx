// @flow

import React, { Fragment } from "react";
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

const Claims = ({
  onChangeRow,
  type = "user",
  googleColumns,
  claims
}: Props) => (
  <Fragment>
    <h4>Claims used to identify {type}</h4>
    <table className="full-width">
      <tbody>
        {CLAIMS[type].map((claim, i) => (
          <ClaimLine
            key={i}
            googleColumns={googleColumns}
            value={_.get(claims, claim)}
            claim={claim}
            onUpdate={onChangeRow}
          />
        ))}
      </tbody>
    </table>
  </Fragment>
);

export default Claims;
