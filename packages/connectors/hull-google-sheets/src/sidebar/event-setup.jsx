// @flow

import React, { Fragment } from "react";
import _ from "lodash";
import ClaimLine from "./claim-line";

import type { EventType, ImportType, GoogleColumns } from "../../types";
import Errors from "./errors";

const USER_EVENT_ATTRIBUTES = ["event_id", "event_name", "created_at"];
const SETUP = {
  user_event: USER_EVENT_ATTRIBUTES
};

type Props = {
  type?: ImportType,
  errors?: Array<string>,
  googleColumns?: GoogleColumns,
  eventSetup?: EventType,
  valid: boolean,
  onChangeRow: EventType => void
};

const EventSetup = ({
  onChangeRow,
  type = "user",
  googleColumns,
  errors,
  eventSetup
}: Props) => (
  <Fragment>
    <h4>Event setup for {type}</h4>
    <Errors errors={errors} />
    <table className="full-width">
      <tbody>
        {SETUP[type].map((setup, i) => (
          <ClaimLine
            key={i}
            googleColumns={googleColumns}
            value={_.get(eventSetup, setup)}
            claim={setup}
            onUpdate={onChangeRow}
          />
        ))}
      </tbody>
    </table>
  </Fragment>
);

export default EventSetup;
