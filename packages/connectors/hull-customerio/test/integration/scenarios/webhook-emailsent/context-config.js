const {
  ContextMock
} = require("../../helper/connector-mock");

module.exports = () => {
  const ctxMock = new ContextMock("1234", {}, {
    synchronized_segments: ["5a7ddcbab3eea848ce0071ef"],
    enable_user_deletion: false,
    anonymous_events: false,
    user_id_mapping: "id",
    events_filter: ["page"],
    synchronized_attributes: ["last_name",
      "first_name",
      "last_known_ip",
      "address_country",
      "traits_last_opened",
      "traits_last_emailed",
      "traits_custom_fields_unsubscribed",
      "traits_custom_fields_hard_bounced",
      "traits_custom_fields_marked_as_spam",
      "traits_custom_fields_country",
      "traits_custom_fields_state_region",
      "traits_intercom/unsubscribed_from_emails",
      "traits_intercom/last_seen_ip",
      "traits_vault_trial/user_id",
      "traits_vault_trial/product",
      "traits_vault_trial/email",
      "traits_vault_trial/ip",
      "traits_vault_trial/start_date_unix",
      "traits_vault_trial/end_date_unix",
      "first_seen_at",
      "last_seen_at",
      "traits_salesforce_lead/id",
      "traits_salesforce_lead/title",
      "traits_salesforce_lead/company",
      "traits_salesforce_lead/first_name",
      "traits_salesforce_lead/email",
      "traits_salesforce_lead/last_name",
      "traits_salesforce_lead/country",
      "traits_salesforce_lead/lead_source",
      "traits_salesforce_lead/lead_product",
      "traits_salesforce_lead/industry",
      "account.clearbit/time_zone",
      "traits_vault_trial/start_date",
      "traits_vault_trial/end_date"
    ],
    site_id: "123456789",
    api_key: "asufglilibbhe3864932",
    credentials_title: "",
    configuration_title: "",
    synchronized_segments_hero: "",
    send_events_hero: "",
    data_title: ""
  });

  return ctxMock;
};
