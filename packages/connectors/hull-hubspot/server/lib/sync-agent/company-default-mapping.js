/* @flow */
/* eslint-disable */
import type { HubspotDefaultCompanyMapping } from "../../types";
const DEFAULT_MAPPING: Array<HubspotDefaultCompanyMapping> = [
  {
    hubspot: "about_us",
    hull: "hubspot/about_us",
    type: "string",
    title: "About Us",
    read_only: false
  },
  {
    hubspot: "first_deal_created_date",
    hull: "hubspot/first_deal_created_date",
    type: "datetime",
    title: "First Deal Created Date",
    read_only: true
  },
  {
    hubspot: "founded_year",
    hull: "hubspot/founded_year",
    type: "string",
    title: "Year Founded",
    read_only: false
  },
  {
    hubspot: "hs_avatar_filemanager_key",
    hull: "hubspot/hs_avatar_filemanager_key",
    type: "string",
    title: "Avatar FileManager key",
    read_only: true
  },
  {
    hubspot: "hs_lastmodifieddate",
    hull: "hubspot/hs_lastmodifieddate",
    type: "datetime",
    title: "Last Modified Date",
    read_only: true
  },
  {
    hubspot: "hs_predictivecontactscore_v2",
    hull: "hubspot/hs_predictivecontactscore_v2",
    type: "number",
    title: "Likelihood to close",
    read_only: true
  },
  {
    hubspot: "hubspot_owner_assigneddate",
    hull: "hubspot/hubspot_owner_assigneddate",
    type: "datetime",
    title: "Owner Assigned Date",
    read_only: true
  },
  {
    hubspot: "is_public",
    hull: "hubspot/is_public",
    type: "bool",
    title: "Is Public",
    read_only: false
  },
  {
    hubspot: "num_associated_contacts",
    hull: "hubspot/num_associated_contacts",
    type: "number",
    title: "Associated Contacts",
    read_only: true
  },
  {
    hubspot: "num_associated_deals",
    hull: "hubspot/num_associated_deals",
    type: "number",
    title: "Associated Deals",
    read_only: true
  },
  {
    hubspot: "recent_deal_amount",
    hull: "hubspot/recent_deal_amount",
    type: "number",
    title: "Recent Deal Amount",
    read_only: true
  },
  {
    hubspot: "recent_deal_close_date",
    hull: "hubspot/recent_deal_close_date",
    type: "datetime",
    title: "Recent Deal Close Date",
    read_only: true
  },
  {
    hubspot: "timezone",
    hull: "hubspot/timezone",
    type: "string",
    title: "Time Zone",
    read_only: false
  },
  {
    hubspot: "total_money_raised",
    hull: "hubspot/total_money_raised",
    type: "string",
    title: "Total Money Raised",
    read_only: false
  },
  {
    hubspot: "total_revenue",
    hull: "hubspot/total_revenue",
    type: "number",
    title: "Total Revenue",
    read_only: true
  },
  {
    hubspot: "name",
    hull: "hubspot/name",
    type: "string",
    title: "Name",
    read_only: false
  },
  {
    hubspot: "phone",
    hull: "hubspot/phone",
    type: "string",
    title: "Phone Number",
    read_only: false
  },
  {
    hubspot: "address",
    hull: "hubspot/address",
    type: "string",
    title: "Street Address",
    read_only: false
  },
  {
    hubspot: "address2",
    hull: "hubspot/address2",
    type: "string",
    title: "Street Address 2",
    read_only: false
  },
  {
    hubspot: "city",
    hull: "hubspot/city",
    type: "string",
    title: "City",
    read_only: false
  },
  {
    hubspot: "state",
    hull: "hubspot/state",
    type: "string",
    title: "State/Region",
    read_only: false
  },
  {
    hubspot: "hs_sales_email_last_replied",
    hull: "hubspot/hs_sales_email_last_replied",
    type: "datetime",
    title: "Recent Sales Email Replied Date",
    read_only: true
  },
  {
    hubspot: "hubspot_owner_id",
    hull: "hubspot/hubspot_owner_id",
    type: "enumeration",
    title: "Company owner",
    read_only: false
  },
  {
    hubspot: "notes_last_contacted",
    hull: "hubspot/notes_last_contacted",
    type: "datetime",
    title: "Last Contacted",
    read_only: true
  },
  {
    hubspot: "notes_last_updated",
    hull: "hubspot/notes_last_updated",
    type: "datetime",
    title: "Last Activity Date",
    read_only: true
  },
  {
    hubspot: "notes_next_activity_date",
    hull: "hubspot/notes_next_activity_date",
    type: "datetime",
    title: "Next Activity Date",
    read_only: true
  },
  {
    hubspot: "num_contacted_notes",
    hull: "hubspot/num_contacted_notes",
    type: "number",
    title: "Number of times contacted",
    read_only: true
  },
  {
    hubspot: "num_notes",
    hull: "hubspot/num_notes",
    type: "number",
    title: "Number of Sales Activities",
    read_only: true
  },
  {
    hubspot: "zip",
    hull: "hubspot/zip",
    type: "string",
    title: "Postal Code",
    read_only: false
  },
  {
    hubspot: "country",
    hull: "hubspot/country",
    type: "string",
    title: "Country",
    read_only: false
  },
  {
    hubspot: "hubspot_team_id",
    hull: "hubspot/hubspot_team_id",
    type: "enumeration",
    title: "HubSpot Team",
    read_only: true
  },
  {
    hubspot: "hs_all_owner_ids",
    hull: "hubspot/hs_all_owner_ids",
    type: "enumeration",
    title: "All owner ids",
    read_only: true
  },
  {
    hubspot: "website",
    hull: "hubspot/website",
    type: "string",
    title: "Website URL",
    read_only: false
  },
  {
    hubspot: "domain",
    hull: "hubspot/domain",
    type: "string",
    title: "Company Domain Name",
    read_only: false
  },
  {
    hubspot: "hs_all_team_ids",
    hull: "hubspot/hs_all_team_ids",
    type: "enumeration",
    title: "All team ids",
    read_only: true
  },
  {
    hubspot: "hs_all_accessible_team_ids",
    hull: "hubspot/hs_all_accessible_team_ids",
    type: "enumeration",
    title: "All accessible team ids",
    read_only: true
  },
  {
    hubspot: "numberofemployees",
    hull: "hubspot/numberofemployees",
    type: "number",
    title: "Number of Employees",
    read_only: false
  },
  {
    hubspot: "industry",
    hull: "hubspot/industry",
    type: "enumeration",
    title: "Industry",
    read_only: false
  },
  {
    hubspot: "annualrevenue",
    hull: "hubspot/annualrevenue",
    type: "number",
    title: "Annual Revenue",
    read_only: false
  },
  {
    hubspot: "lifecyclestage",
    hull: "hubspot/lifecyclestage",
    type: "enumeration",
    title: "Lifecycle Stage",
    read_only: false
  },
  {
    hubspot: "hs_lead_status",
    hull: "hubspot/hs_lead_status",
    type: "enumeration",
    title: "Lead Status",
    read_only: false
  },
  {
    hubspot: "hs_parent_company_id",
    hull: "hubspot/hs_parent_company_id",
    type: "number",
    title: "Parent Company",
    read_only: true
  },
  {
    hubspot: "type",
    hull: "hubspot/type",
    type: "enumeration",
    title: "Type",
    read_only: false
  },
  {
    hubspot: "description",
    hull: "hubspot/description",
    type: "string",
    title: "Description",
    read_only: false
  },
  {
    hubspot: "hs_num_child_companies",
    hull: "hubspot/hs_num_child_companies",
    type: "number",
    title: "Number of child companies",
    read_only: true
  },
  {
    hubspot: "createdate",
    hull: "hubspot/createdate",
    type: "datetime",
    title: "Create Date",
    read_only: true
  },
  {
    hubspot: "closedate",
    hull: "hubspot/closedate",
    type: "datetime",
    title: "Close Date",
    read_only: false
  },
  {
    hubspot: "first_contact_createdate",
    hull: "hubspot/first_contact_createdate",
    type: "datetime",
    title: "First Contact Create Date",
    read_only: true
  },
  {
    hubspot: "web_technologies",
    hull: "hubspot/web_technologies",
    type: "enumeration",
    title: "Web Technologies",
    read_only: false
  },
  {
    hubspot: "facebookfans",
    hull: "hubspot/facebookfans",
    type: "number",
    title: "Facebook Fans",
    read_only: false
  },
  {
    hubspot: "twitterhandle",
    hull: "hubspot/twitterhandle",
    type: "string",
    title: "Twitter Handle",
    read_only: false
  },
  {
    hubspot: "twitterbio",
    hull: "hubspot/twitterbio",
    type: "string",
    title: "Twitter Bio",
    read_only: false
  },
  {
    hubspot: "twitterfollowers",
    hull: "hubspot/twitterfollowers",
    type: "number",
    title: "Twitter Followers",
    read_only: false
  },
  {
    hubspot: "facebook_company_page",
    hull: "hubspot/facebook_company_page",
    type: "string",
    title: "Facebook Company Page",
    read_only: false
  },
  {
    hubspot: "linkedin_company_page",
    hull: "hubspot/linkedin_company_page",
    type: "string",
    title: "LinkedIn Company Page",
    read_only: false
  },
  {
    hubspot: "linkedinbio",
    hull: "hubspot/linkedinbio",
    type: "string",
    title: "LinkedIn Bio",
    read_only: false
  },
  {
    hubspot: "googleplus_page",
    hull: "hubspot/googleplus_page",
    type: "string",
    title: "Google Plus Page",
    read_only: false
  },
  {
    hubspot: "hs_analytics_first_timestamp",
    hull: "hubspot/hs_analytics_first_timestamp",
    type: "datetime",
    title: "Time First Seen",
    read_only: true
  },
  {
    hubspot: "hs_analytics_first_touch_converting_campaign",
    hull: "hubspot/hs_analytics_first_touch_converting_campaign",
    type: "string",
    title: "First Touch Converting Campaign",
    read_only: true
  },
  {
    hubspot: "hs_analytics_first_visit_timestamp",
    hull: "hubspot/hs_analytics_first_visit_timestamp",
    type: "datetime",
    title: "Time of First Visit",
    read_only: true
  },
  {
    hubspot: "hs_analytics_last_timestamp",
    hull: "hubspot/hs_analytics_last_timestamp",
    type: "datetime",
    title: "Time Last Seen",
    read_only: true
  },
  {
    hubspot: "hs_analytics_last_touch_converting_campaign",
    hull: "hubspot/hs_analytics_last_touch_converting_campaign",
    type: "string",
    title: "Last Touch Converting Campaign",
    read_only: true
  },
  {
    hubspot: "hs_analytics_last_visit_timestamp",
    hull: "hubspot/hs_analytics_last_visit_timestamp",
    type: "datetime",
    title: "Time of Last Session",
    read_only: true
  },
  {
    hubspot: "hs_analytics_num_page_views",
    hull: "hubspot/hs_analytics_num_page_views",
    type: "number",
    title: "Number of Pageviews",
    read_only: true
  },
  {
    hubspot: "hs_analytics_num_visits",
    hull: "hubspot/hs_analytics_num_visits",
    type: "number",
    title: "Number of Visits",
    read_only: true
  },
  {
    hubspot: "hs_analytics_source",
    hull: "hubspot/hs_analytics_source",
    type: "enumeration",
    title: "Original Source Type",
    read_only: true
  },
  {
    hubspot: "hs_analytics_source_data_1",
    hull: "hubspot/hs_analytics_source_data_1",
    type: "string",
    title: "Original Source Data 1",
    read_only: true
  },
  {
    hubspot: "hs_analytics_source_data_2",
    hull: "hubspot/hs_analytics_source_data_2",
    type: "string",
    title: "Original Source Data 2",
    read_only: true
  },
  {
    hubspot: "days_to_close",
    hull: "hubspot/days_to_close",
    type: "number",
    title: "Days to Close",
    read_only: true
  }
];

module.exports = DEFAULT_MAPPING;
