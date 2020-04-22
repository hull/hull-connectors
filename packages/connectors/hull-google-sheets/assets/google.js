const props = {
  columns: ["FirstName", "LastName", "Email", "", "Boom", "Bam", "Extra", "Fuck ", "Forever !"],
  hullFields: ["accepts_marketing", "account", "address_city", "address_country", "address_state", "amazon_connected_at", "amazon_id", "anonymous_ids", "created_at", "domain", "email", "external_id", "facebook_age_range_min", "facebook_connected_at", "facebook_gender", "facebook_id", "first_name", "first_seen_at", "first_session_initial_referrer", "first_session_initial_url", "first_session_platform_id", "first_session_started_at", "google_connected_at", "google_id", "has_password", "id", "identities_count", "indexed_at", "instagram_connected_at", "instagram_id", "instagram_username", "invited_by_id", "is_approved", "last_known_ip", "last_name", "last_seen_at", "latest_session_initial_referrer", "latest_session_initial_url", "latest_session_platform_id", "latest_session_started_at", "main_identity", "name", "phone", "picture", "shopify_connected_at", "shopify_id", "signup_session_initial_referrer", "signup_session_initial_url", "signup_session_platform_id", "signup_session_started_at", "traits_0", "traits_1", "traits_2", "traits_city", "traits_clearbit/aboutme_avatar", "traits_clearbit/aboutme_bio", "traits_clearbit/aboutme_handle", "traits_clearbit/bio", "traits_clearbit/country_code", "traits_clearbit/countrycode", "traits_clearbit/employment_domain", "traits_clearbit/employment_name", "traits_clearbit/employment_role", "traits_clearbit/employment_seniority", "traits_clearbit/employment_title", "traits_clearbit/enriched_at", "traits_clearbit/facebook_handle", "traits_clearbit/fetched_at", "traits_clearbit/gender", "traits_clearbit/github_avatar", "traits_clearbit/github_blog", "traits_computed/processed", "traits_count", "traits_country", "traits_customerio/created_at", "traits_customerio/deleted_at", "traits_customerio/email", "traits_customerio/id", "traits_customerio/name", "traits_customerscore/adoption", "traits_customerscore/combined", "traits_customerscore/relationship", "traits_datanyze/country", "traits_datanyze/country_iso", "traits_datanyze/country_name", "traits_datanyze/domain", "traits_datanyze/employees", "traits_delighted/last_email_sent_at", "traits_description", "traits_external_id", "traits_fax", "traits_first_name", "traits_flat", "traits_foo", "traits_full_name", "traits_gemder", "traits_gender", "traits_hasviewedproductsfrequentlyatsometime", "traits_hello", "traits_hello/again", "traits_hello/world", "traits_hubspot/annual_revenue", "traits_hubspot/associated_deals_count", "traits_hubspot/became_customer_at", "traits_hubspot/became_opportunity_at", "traits_madkudu/customer_fit_segment", "traits_madkudu/customer_fit_self_serve_segment", "traits_madkudu/customer_fit_top_signals", "traits_madkudu/fetched_at", "traits_mailchimp/avg_click_rate", "traits_mailchimp/avg_open_rate", "traits_mailchimp/country_code", "traits_mailchimp/email", "traits_mailchimp/email_client", "traits_mailchimp/fname", "traits_mailchimp/import_error", "traits_salesforce_contact/email", "traits_salesforce_contact/first_name", "traits_salesforce_contact/id", "traits_salesforce_contact/last_modified_date", "traits_salesforce_contact/last_name", "traits_salesforce_contact/mailing_city", "traits_salesforce_contact/mailing_country", "traits_salesforce_lead/is_converted", "traits_salesforce_lead/last_modified_date", "traits_salesforce_lead/last_name", "traits_salesforce_lead/name", "traits_salesforce_lead/owner_id", "traits_salesforce_lead/phone", "traits_salesforce_lead/postal_code", "traits_salesforce_lead/salutation", "traits_salesforce_lead/state", "traits_salesforce_lead/system_modstamp", "traits_salesforce_lead/title", "updated_at"],
  mapping: [
    { enabled: false, hullField: "first_name"},
    { enabled: true, hullField: "last_name" },
    { enabled: true, hullField: "facebook_connected_at" },
    { enabled: false },
    { enabled: true, hullField: "traits_event_counts/boom again" },
    { enabled: true, hullField: null },
    { hullField: "561fb665450f34b1cf00000f_ecommerce_first_order_at" },
    { hullField: "traits_clearbit/aboutme_avatar" },
    { hullField: "young" }
  ],
  settings: { hullToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU5ZTljZWY0MTllYzhkNmEzNjAwMDA5NSIsInNlY3JldCI6IjQyZTQyMzQ3OWFiYWUyN2EyMDNjNmQzNzliNDkxOTJjIiwib3JnYW5pemF0aW9uIjoiYTIzOWM1YjIuaHVsbGJldGEuaW8iLCJzaGlwIjoiNTllOWNlZjQxOWVjOGQ2YTM2MDAwMDk1In0.u5tLg-s92uWUftskHRwu31xHsGO-LsyD2ajsj1L6HnQ" }
};


function bootstrap() {
  console.warn("Hello boostrap: ");
  return props;
}

function setUserProp(key, value) {
  props[key] = value;
  return props;
}

function importData() {
  console.warn("Yeah, import done !");
}


window.GoogleServiceMock = [bootstrap, setUserProp, importData].reduce((service, fn) => {
  service[fn.name] = (...args) => Promise.resolve(fn.apply(undefined, args));
  return service;
}, {});
