/* @flow */
/* eslint-disable */
import type { HubspotDefaultContactMapping } from "../../types";
const DEFAULT_MAPPING: Array<HubspotDefaultContactMapping> = [
  {
    name: "email",
    hull: "email",
    type: "string",
    title: "Email",
    read_only: false
  },
  {
    name: "salutation",
    hull: "traits_hubspot/salutation",
    type: "string",
    title: "Salutation",
    read_only: false
  },
  {
    name: "firstname",
    hull: "traits_hubspot/first_name",
    type: "string",
    title: "First Name",
    read_only: false
  },
  {
    name: "lastname",
    hull: "traits_hubspot/last_name",
    type: "string",
    title: "Last Name",
    read_only: false
  },
  {
    name: "phone",
    hull: "traits_hubspot/phone",
    type: "string",
    title: "Phone Number",
    read_only: false
  },
  {
    name: "mobilephone",
    hull: "traits_hubspot/mobile_phone",
    type: "string",
    title: "Mobile Phone Number",
    read_only: false
  },
  {
    name: "address",
    hull: "traits_hubspot/address_street",
    type: "string",
    title: "Street Address",
    read_only: false
  },
  {
    name: "city",
    hull: "traits_hubspot/address_city",
    type: "string",
    title: "City",
    read_only: false
  },
  {
    name: "zip",
    hull: "traits_hubspot/address_postal_code",
    type: "string",
    title: "Postal Code",
    read_only: false
  },
  {
    name: "state",
    hull: "traits_hubspot/address_state",
    type: "string",
    title: "State/Region",
    read_only: false
  },
  {
    name: "country",
    hull: "traits_hubspot/address_country",
    type: "string",
    title: "Country",
    read_only: false
  },
  {
    name: "fax",
    hull: "traits_hubspot/fax",
    type: "string",
    title: "Fax Number",
    read_only: false
  },
  {
    name: "company",
    hull: "traits_hubspot/company",
    type: "string",
    title: "Company Name",
    read_only: false
  },
  {
    name: "industry",
    hull: "traits_hubspot/industry",
    type: "string",
    title: "Industry",
    read_only: false
  },
  {
    name: "jobtitle",
    hull: "traits_hubspot/job_title",
    type: "string",
    title: "Job Title",
    read_only: false
  },
  {
    name: "numemployees",
    hull: "traits_hubspot/employees_count",
    type: "number",
    title: "Number of Employees",
    read_only: false
  },
  {
    name: "website",
    hull: "traits_hubspot/website",
    type: "string",
    title: "Website URL",
    read_only: false
  },
  {
    name: "createdate",
    hull: "traits_hubspot/created_at",
    type: "date",
    title: "Create Date",
    read_only: false
  },
  {
    name: "closedate",
    hull: "traits_hubspot/closed_at",
    type: "date",
    title: "Close Date",
    read_only: false
  },
  {
    name: "lastmodifieddate",
    hull: "traits_hubspot/updated_at",
    type: "date",
    title: "Last Modified Date",
    read_only: false
  },
  {
    name: "annualrevenue",
    hull: "traits_hubspot/annual_revenue",
    type: "number",
    title: "Annual Revenue",
    read_only: false
  },
  {
    name: "total_revenue",
    hull: "traits_hubspot/total_revenue",
    type: "number",
    title: "Total Revenue",
    read_only: false
  },
  {
    name: "lifecyclestage",
    hull: "traits_hubspot/lifecycle_stage",
    type: "string",
    title: "Lifecycle Stage",
    read_only: false
  },
  {
    name: "days_to_close",
    hull: "traits_hubspot/days_to_close",
    type: "number",
    title: "Days To Close",
    read_only: true
  },
  {
    name: "first_deal_created_date",
    hull: "traits_hubspot/first_deal_created_at",
    type: "date",
    title: "First Deal Created Date",
    read_only: false
  },
  {
    name: "num_associated_deals",
    hull: "traits_hubspot/associated_deals_count",
    type: "number",
    title: "Associated Deals",
    read_only: true
  },
  {
    name: "hubspot_owner_id",
    hull: "traits_hubspot/hubspot_owner_id",
    type: "string",
    title: "HubSpot Owner",
    read_only: false
  },
  {
    name: "hs_email_optout",
    hull: "traits_hubspot/email_optout",
    type: "boolean",
    title: "Opted out of all email",
    read_only: true
  },
  {
    name: "blog_default_hubspot_blog_subscription",
    hull: "traits_hubspot/default_hubspot_blog_subscription",
    type: "boolean",
    title: "Default HubSpot Blog Email Subscription",
    read_only: false
  },
  {
    name: "message",
    hull: "traits_hubspot/message",
    type: "string",
    title: "Message",
    read_only: false
  },
  {
    name: "recent_deal_amount",
    hull: "traits_hubspot/recent_deal_amount",
    type: "number",
    title: "Recent Deal Amount",
    read_only: false
  },
  {
    name: "recent_deal_close_date",
    hull: "traits_hubspot/recent_deal_closed_at",
    type: "date",
    title: "Recent Deal Close Date",
    read_only: false
  },
  {
    name: "num_notes",
    hull: "traits_hubspot/notes_count",
    type: "number",
    title: "Number of Sales Activities",
    read_only: true
  },
  {
    name: "num_contacted_notes",
    hull: "traits_hubspot/contacted_notes_count",
    type: "string",
    title: "Number of times contacted",
    read_only: true
  },
  {
    name: "notes_last_contacted",
    hull: "traits_hubspot/notes_last_contacted_at",
    type: "date",
    title: "Last Contacted",
    read_only: false
  },
  {
    name: "notes_last_updated",
    hull: "traits_hubspot/last_activity_at",
    type: "date",
    title: "Last Activity Date",
    read_only: false
  },
  {
    name: "notes_next_activity_date",
    hull: "traits_hubspot/next_activity_at",
    type: "date",
    title: "Next Activity Date",
    read_only: false
  },
  {
    name: "hubspot_owner_assigneddate",
    hull: "traits_hubspot/owner_assigned_at",
    type: "date",
    title: "Owner Assigned Date",
    read_only: false
  },
  {
    name: "hs_lead_status",
    hull: "traits_hubspot/lead_status",
    type: "string",
    title: "Lead Status",
    read_only: false
  },
  {
    name: "hs_lifecyclestage_customer_date",
    hull: "traits_hubspot/became_customer_at",
    type: "date",
    title: "Became a Customer Date",
    read_only: false
  },
  {
    name: "hs_lifecyclestage_lead_date",
    hull: "traits_hubspot/became_lead_at",
    type: "date",
    title: "Became a Lead Date",
    read_only: false
  },
  {
    name: "hs_lifecyclestage_marketingqualifiedlead_date",
    hull: "traits_hubspot/became_marketing_qualified_lead_at",
    type: "date",
    title: "Became a Marketing Qualified Lead Date",
    read_only: false
  },
  {
    name: "hs_lifecyclestage_salesqualifiedlead_date",
    hull: "traits_hubspot/became_sales_qualified_lead_at",
    type: "date",
    title: "Became a Sales Qualified Lead Date",
    read_only: false
  },
  {
    name: "hs_lifecyclestage_subscriber_date",
    hull: "traits_hubspot/became_subscriber_at",
    type: "date",
    title: "Became a Subscriber Date",
    read_only: false
  },
  {
    name: "hs_lifecyclestage_evangelist_date",
    hull: "traits_hubspot/became_evangelist_at",
    type: "date",
    title: "Became an Evangelist Date",
    read_only: false
  },
  {
    name: "hs_lifecyclestage_opportunity_date",
    hull: "traits_hubspot/became_opportunity_at",
    type: "date",
    title: "Became an Opportunity Date",
    read_only: false
  },
  {
    name: "hs_lifecyclestage_other_date",
    hull: "traits_hubspot/became_other_at",
    type: "date",
    title: "Became an Other Lifecycle Date",
    read_only: false
  },
  {
    name: "hs_email_bounce",
    hull: "traits_hubspot/emails_bounced_count",
    title: "",
    type: "number",
    read_only: true
  },
  {
    name: "hs_email_open",
    hull: "traits_hubspot/opened_count",
    title: "",
    type: "number",
    read_only: true
  },
  {
    name: "associatedcompanyid",
    hull: "traits_hubspot/associatedcompanyid",
    title: "",
    type: "string",
    read_only: false
  }
];

module.exports = DEFAULT_MAPPING;
