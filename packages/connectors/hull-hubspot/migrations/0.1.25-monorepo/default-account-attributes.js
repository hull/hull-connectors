const defaultAccountAttributes = [
  {
    service: "properties.about_us.value",
    hull: "hubspot/about_us",
    overwrite: true
  },
  {
    service: "properties.hs_all_accessible_team_ids.value",
    hull: "hubspot/hs_all_accessible_team_ids",
    overwrite: true
  },
  {
    service: "properties.hs_all_owner_ids.value",
    hull: "hubspot/hs_all_owner_ids",
    overwrite: true
  },
  {
    service: "properties.hs_all_team_ids.value",
    hull: "hubspot/hs_all_team_ids",
    overwrite: true
  },
  {
    service: "properties.annualrevenue.value",
    hull: "hubspot/annualrevenue",
    overwrite: true
  },
  {
    service: "properties.num_associated_contacts.value",
    hull: "hubspot/num_associated_contacts",
    overwrite: true
  },
  {
    service: "properties.num_associated_deals.value",
    hull: "hubspot/num_associated_deals",
    overwrite: true
  },
  {
    service: "properties.hs_avatar_filemanager_key.value",
    hull: "hubspot/hs_avatar_filemanager_key",
    overwrite: true
  },
  { service: "properties.city.value", hull: "hubspot/city", overwrite: true },
  {
    service: "properties.closedate.value",
    hull: "hubspot/close_date",
    overwrite: true
  },
  {
    service: "properties.hubspot_owner_id.value",
    hull: "hubspot/hubspot_owner_id",
    overwrite: true
  },
  {
    service: "properties.country.value",
    hull: "hubspot/country",
    overwrite: true
  },
  {
    service: "properties.createdate.value",
    hull: "hubspot/create_date",
    overwrite: true
  },
  {
    service: "properties.days_to_close.value",
    hull: "hubspot/days_to_close",
    overwrite: true
  },
  {
    service: "properties.description.value",
    hull: "hubspot/description",
    overwrite: true
  },
  {
    service: "properties.facebook_company_page.value",
    hull: "hubspot/facebook_company_page",
    overwrite: true
  },
  {
    service: "properties.facebookfans.value",
    hull: "hubspot/facebookfans",
    overwrite: true
  },
  {
    service: "properties.first_contact_createdate.value",
    hull: "hubspot/first_contact_create_date",
    overwrite: true
  },
  {
    service: "properties.first_deal_created_date.value",
    hull: "hubspot/first_deal_created_date",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_first_touch_converting_campaign.value",
    hull: "hubspot/hs_analytics_first_touch_converting_campaign",
    overwrite: true
  },
  {
    service: "properties.googleplus_page.value",
    hull: "hubspot/googleplus_page",
    overwrite: true
  },
  {
    service: "properties.hubspot_team_id.value",
    hull: "hubspot/hubspot_team_id",
    overwrite: true
  },
  {
    service: "properties.industry.value",
    hull: "hubspot/industry",
    overwrite: true
  },
  {
    service: "properties.is_public.value",
    hull: "hubspot/is_public",
    overwrite: true
  },
  {
    service: "properties.notes_last_updated.value",
    hull: "hubspot/notes_last_updated_at",
    overwrite: true
  },
  {
    service: "properties.notes_last_contacted.value",
    hull: "hubspot/notes_last_contacted_at",
    overwrite: true
  },
  {
    service: "properties.hs_lastmodifieddate.value",
    hull: "hubspot/hs_lastmodified_date",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_last_touch_converting_campaign.value",
    hull: "hubspot/hs_analytics_last_touch_converting_campaign",
    overwrite: true
  },
  {
    service: "properties.hs_lead_status.value",
    hull: "hubspot/hs_lead_status",
    overwrite: true
  },
  {
    service: "properties.lifecyclestage.value",
    hull: "hubspot/lifecyclestage",
    overwrite: true
  },
  {
    service: "properties.linkedinbio.value",
    hull: "hubspot/linkedinbio",
    overwrite: true
  },
  {
    service: "properties.linkedin_company_page.value",
    hull: "hubspot/linkedin_company_page",
    overwrite: true
  },
  { service: "properties.name.value", hull: "hubspot/name", overwrite: true },
  {
    service: "properties.notes_next_activity_date.value",
    hull: "hubspot/notes_next_activity_date",
    overwrite: true
  },
  {
    service: "properties.numberofemployees.value",
    hull: "hubspot/numberofemployees",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_num_page_views.value",
    hull: "hubspot/hs_analytics_num_page_views",
    overwrite: true
  },
  {
    service: "properties.num_notes.value",
    hull: "hubspot/num_notes",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_num_visits.value",
    hull: "hubspot/hs_analytics_num_visits",
    overwrite: true
  },
  {
    service: "properties.hs_num_child_companies.value",
    hull: "hubspot/hs_num_child_companies",
    overwrite: true
  },
  {
    service: "properties.num_contacted_notes.value",
    hull: "hubspot/num_contacted_notes",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_source_data_1.value",
    hull: "hubspot/hs_analytics_source_data_1",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_source_data_2.value",
    hull: "hubspot/hs_analytics_source_data_2",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_source.value",
    hull: "hubspot/hs_analytics_source",
    overwrite: true
  },
  {
    service: "properties.hubspot_owner_assigneddate.value",
    hull: "hubspot/hubspot_owner_assigned_date",
    overwrite: true
  },
  {
    service: "properties.hs_parent_company_id.value",
    hull: "hubspot/hs_parent_company_id",
    overwrite: true
  },
  { service: "properties.phone.value", hull: "hubspot/phone", overwrite: true },
  { service: "properties.zip.value", hull: "hubspot/zip", overwrite: true },
  {
    service: "properties.recent_deal_amount.value",
    hull: "hubspot/recent_deal_amount",
    overwrite: true
  },
  {
    service: "properties.recent_deal_close_date.value",
    hull: "hubspot/recent_deal_close_date",
    overwrite: true
  },
  {
    service: "properties.hs_sales_email_last_replied.value",
    hull: "hubspot/hs_sales_email_last_replied",
    overwrite: true
  },
  { service: "properties.state.value", hull: "hubspot/state", overwrite: true },
  {
    service: "properties.address.value",
    hull: "hubspot/address",
    overwrite: true
  },
  {
    service: "properties.address2.value",
    hull: "hubspot/address2",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_first_timestamp.value",
    hull: "hubspot/hs_analytics_first_timestamp",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_last_timestamp.value",
    hull: "hubspot/hs_analytics_last_timestamp",
    overwrite: true
  },
  {
    service: "properties.timezone.value",
    hull: "hubspot/timezone",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_first_visit_timestamp.value",
    hull: "hubspot/hs_analytics_first_visit_timestamp",
    overwrite: true
  },
  {
    service: "properties.hs_analytics_last_visit_timestamp.value",
    hull: "hubspot/hs_analytics_last_visit_timestamp",
    overwrite: true
  },
  {
    service: "properties.total_money_raised.value",
    hull: "hubspot/total_money_raised",
    overwrite: true
  },
  {
    service: "properties.total_revenue.value",
    hull: "hubspot/total_revenue",
    overwrite: true
  },
  {
    service: "properties.twitterbio.value",
    hull: "hubspot/twitterbio",
    overwrite: true
  },
  {
    service: "properties.twitterfollowers.value",
    hull: "hubspot/twitterfollowers",
    overwrite: true
  },
  {
    service: "properties.twitterhandle.value",
    hull: "hubspot/twitterhandle",
    overwrite: true
  },
  { service: "properties.type.value", hull: "hubspot/type", overwrite: true },
  {
    service: "properties.web_technologies.value.$split(';')",
    hull: "hubspot/web_technologies",
    overwrite: true
  },
  {
    service: "properties.website.value",
    hull: "hubspot/website",
    overwrite: true
  },
  {
    service: "properties.founded_year.value",
    hull: "hubspot/founded_year",
    overwrite: true
  }
];

module.exports = {
  defaultAccountAttributes
};
