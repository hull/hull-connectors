module.exports = {
  "configuration": {
    "id": "5d51b4ebc07907e865025a7b",
    "secret": "shhhhhh",
    "organization": "organization.hullapp.io",
    "hostname": "225ddbbc.connector.io",
    "private_settings": {
      "coppercrm_api_key": process.env.COPPER_API_KEY,
      "coppercrm_email": process.env.COPPER_EMAIL,

      "lead_claims": [
        {
          "hull": "email",
          "service": "primaryEmail"
        }
      ],
      "synchronized_lead_segments": [],
      "account_claims": [
        {
          "hull": "domain",
          "service": "domain"
        }
      ],
      "link_users_in_hull": false,
      "synchronized_account_segments": [],
      "link_users_in_service": true,
      "token_expires_in": 7199,
      "token_created_at": 1565635830,
      "refresh_token": "refresh_token",
      "access_token": "access_token",
      "incoming_lead_attributes": [
        {
          "hull": "coppercrm_lead/addressstreet",
          "service": "addressStreet"
        },
        {
          "hull": "coppercrm_lead/first_name",
          "service": "first_name"
        },
        {
          "hull": "coppercrm_lead/assigneeEmail",
          "service": "assigneeEmail"
        }
      ]
    }
  },
  "route": "fetchAllLeads",
  "input": expect.anything(),
  "serviceRequests": [
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {"ident":{"email":"samanthas@copper.com","anonymous_id":"coppercrm-lead:lead-50307894"},"attributes":{"coppercrm_lead/addressstreet":{"operation":"set","value":"1234 Happy Ln"},"coppercrm_lead/first_name":{"operation":"set","value":"Samantha Summers (Sample - Try me!)"},"coppercrm_lead/id":{"value":50307894,"operation":"set"}}},
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "hull",
      "op": "asUser",
      "input": {"ident":{"email":"andrews@copper.com","anonymous_id":"coppercrm-lead:lead-50307895"},"attributes":{"coppercrm_lead/addressstreet":{"operation":"set","value":"301 Howard Street"},"coppercrm_lead/first_name":{"operation":"set","value":"Andrew Sung (Sample - Try me!)"},"coppercrm_lead/assigneeEmail":{"operation":"set","value":"timliuhull2@gmail.com"},"coppercrm_lead/id":{"value":50307895,"operation":"set"}}},
      "result": {}
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getUsers",
      "input": undefined,
      "result": { body: [{"id":806394,"name":"Tim Liu","email":"timliuhull2@gmail.com"}] }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "getCustomerSources",
      "input": undefined,
      "result": { body: [{"id":1046842,"name":"Advertising"},{"id":1046841,"name":"Cold Call"},{"id":1046840,"name":"Email"}] }
    },
    {
      "localContext": expect.anything(),
      "name": "coppercrm",
      "op": "fetchAllLeads",
      "input": undefined,
      "result": { body: [{"id":50307894,"name":"Samantha Summers (Sample - Try me!)","prefix":null,"first_name":"Samantha Summers (Sample - Try me!)","last_name":null,"middle_name":null,"suffix":null,"address":{"street":"1234 Happy Ln","city":"San Francisco","state":"California","postal_code":null,"country":"US"},"assignee_id":null,"company_name":"Copper","customer_source_id":1046842,"details":"A Lead is someone you've qualified as a potential client. When you are ready to start making a deal, simply convert the Lead into an Opportunity.\n\nOnce your Lead becomes an Opportunity, you'll be able to track progress between each stage of the deal making process in your fully customizable Opportunity Pipeline. Add your own Lead and convert it to an Opportunity to see how it works!","email":{"email":"samanthas@copper.com","category":"work"},"interaction_count":0,"monetary_unit":"USD","monetary_value":5000,"converted_unit":"USD","converted_value":"5000.0","socials":[{"url":"https://www.linkedin.com/in/samanthasommatino","category":"linkedin"}],"status":"Junk","status_id":1079555,"tags":["sample"],"title":"Onboarding Project Manager","websites":[{"url":"www.copper.com","category":"work"},{"url":"http://www.samsompix.com","category":"work"}],"phone_numbers":[{"number":"4158546956","category":"work"}],"custom_fields":[],"date_created":1575663576,"date_modified":1575669574,"date_last_contacted":null},{"id":50307895,"name":"Andrew Sung (Sample - Try me!)","prefix":null,"first_name":"Andrew Sung (Sample - Try me!)","last_name":null,"middle_name":null,"suffix":null,"address":{"street":"301 Howard Street","city":"San Francisco","state":"CA","postal_code":"94105","country":null},"assignee_id":806394,"company_name":"Copper","customer_source_id":1046841,"details":"A Lead is someone you've qualified as a potential client. When you are ready to start making a deal, simply convert the Lead into an Opportunity.\n\nOnce your Lead becomes an Opportunity, you'll be able to track progress between each stage of the deal making process in your fully customizable Opportunity Pipeline. Add your own Lead and convert it to an Opportunity to see how it works!","email":{"email":"andrews@copper.com","category":"work"},"interaction_count":0,"monetary_unit":"USD","monetary_value":2500,"converted_unit":"USD","converted_value":"2500.0","socials":[],"status":"Open","status_id":1079553,"tags":["sample"],"title":"Manager","websites":[{"url":"www.copper.com","category":"work"}],"phone_numbers":[{"number":"4158546956","category":"work"}],"custom_fields":[],"date_created":1575663576,"date_modified":1575669530,"date_last_contacted":null}] }
    }
  ],
  "result": expect.anything()
};
