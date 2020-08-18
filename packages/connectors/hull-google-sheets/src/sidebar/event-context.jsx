// @flow

import React, { Fragment } from "react";
import _ from "lodash";
import EventLine from "./event-line";

import type { GoogleColumns, EventContextType } from "../../types";
import Errors from "./errors";

const USER_EVENT_CONTEXT = [
  {
    description: "The Name of the event",
    name: "Event Name",
    setting: "event_name"
  },
  {
    description: "The Date at which the event happens for the user",
    name: "Event Date",
    setting: "created_at"
  },
  {
    description:
      "Pick a value that is stable and GLOBALLY unique (do not pick 1, 2, 3 etc...). Will allow to de-duplicate events in Hull so that they are present only once in the timeline",
    name: "Event ID",
    setting: "event_id"
  }
];

type Props = {
  errors?: Array<string>,
  googleColumns?: GoogleColumns,
  context?: EventContextType,
  valid: boolean,
  onChangeRow: EventContextType => void
};

const EventContext = ({
  onChangeRow,
  googleColumns,
  errors,
  context
}: Props) => (
  <Fragment>
    <h4>Event Import settings</h4>
    <Errors errors={errors} />
    <table className="full-width">
      <tbody>
        {USER_EVENT_CONTEXT.map(({ name, description, setting }, i) => (
          <EventLine
            key={i}
            googleColumns={googleColumns}
            value={_.get(context, setting)}
            setting={setting}
            name={name}
            description={description}
            onUpdate={onChangeRow}
          />
        ))}
      </tbody>
    </table>
  </Fragment>
);

export default EventContext;
