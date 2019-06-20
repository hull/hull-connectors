# Aircall

### A simple Aircall connector that captures the following events:

- Call Created
- Call Answered
- Call Ended
- Call Tagged
- Call Commented
- Call Transferred
- Call Voicemail Left

### For each of those events, we capture the following properties:

 field Name | field Value
-------|------------------------------------
status | "initial" / "answered" / "done"
direction | "inbound" / "outbound"
started_at | when the call started
answered_at | when the call has been answered
ended_at | when the call ended
duration | Duration of the call in seconds
raw_digits | International format of the number of the caller or the callee, or anonymous
voicemail | link to Voicemail recording
recording | link to conversation recording
cost | Cost of the call in U.S. cents
user_id | The ID of the team member who took or made the call
user_email | The Email of the team member who took or made the call
tags | The names of the tags added to this call
comments | Notes added to this call

Please refer to the [Aircall docs](https://developer.aircall.io/api-references/) to see what each field means.

### Setup

1. Install the connector
2. Copy the URL from the Connector's Settings tab
3. Select the Label you want to use in priority in case the contact has multiple emails associated
3. Go to [https://dashboard-v2.aircall.io/integrations](https://dashboard-v2.aircall.io/integrations)
4. Click on "Webhook" then "Install"
5. Paste the URL you copied
6. Activate the following events:
  - `call.created`
  - `call.answered`
  - `call.ended`
  - `call.tagged`
  - `call.commented`
  - `call.transferred`
  - `call.voicemail_left`
7. Click Save
8. You're done!
The other events aren't captured yet. Please contact us if you need to capture them.

![](./webhook-config.png)
