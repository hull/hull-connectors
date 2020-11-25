// @flow

import userTriggers from "./definitions/user-triggers";
import accountTriggers from "./definitions/account-triggers";

/*
Trigger Types:
- user/lead_segments_whitelist
- user/lead_segments_blacklist
- user/lead_segments_entered
- user/lead_segments_left
- user/lead_attribute_updated
- user/lead_events
- is_new_user/lead
- user/lead_account_linked
- is_new_account
- account_segments_whitelist
- account_segments_blacklist
- account_attribute_updated
- account_segments_entered
- account_segments_left
 */
const TRIGGERS = {
  ...userTriggers("user"),
  ...userTriggers("lead"),
  ...accountTriggers("account")
};

export default TRIGGERS;
