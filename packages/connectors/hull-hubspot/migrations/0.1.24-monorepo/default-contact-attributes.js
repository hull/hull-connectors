
const defaultContactAttributes = [
  {
    service: "properties.annualrevenue.value",
    hull: "traits_hubspot/annual_revenue",
    overwrite: true
  },
  {
    service: "properties.associatedcompanyid.value",
    hull: "traits_hubspot/associatedcompanyid",
    overwrite: true
  },
  {
    service: "properties.num_associated_deals.value",
    hull: "traits_hubspot/associated_deals_count",
    overwrite: true
  },
  {
    service: "properties.hs_lifecyclestage_customer_date.value",
    hull: "traits_hubspot/became_customer_at",
    overwrite: true
  },
  {
    service: "properties.hs_lifecyclestage_lead_date.value",
    hull: "traits_hubspot/became_lead_at",
    overwrite: true
  },
  {
    service: "properties.hs_lifecyclestage_marketingqualifiedlead_date.value",
    hull: "traits_hubspot/became_marketing_qualified_lead_at",
    overwrite: true
  },
  {
    service: "properties.hs_lifecyclestage_salesqualifiedlead_date.value",
    hull: "traits_hubspot/became_sales_qualified_lead_at",
    overwrite: true
  },
  {
    service: "properties.hs_lifecyclestage_subscriber_date.value",
    hull: "traits_hubspot/became_subscriber_at",
    overwrite: true
  },
  {
    service: "properties.hs_lifecyclestage_evangelist_date.value",
    hull: "traits_hubspot/became_evangelist_at",
    overwrite: true
  },
  {
    service: "properties.hs_lifecyclestage_opportunity_date.value",
    hull: "traits_hubspot/became_opportunity_at",
    overwrite: true
  },
  {
    service: "properties.hs_lifecyclestage_other_date.value",
    hull: "traits_hubspot/became_other_at",
    overwrite: true
  },
  {
    service: "properties.city.value",
    hull: "traits_hubspot/address_city",
    overwrite: true
  },
  {
    service: "properties.closedate.value",
    hull: "traits_hubspot/closed_at",
    overwrite: true
  },
  {
    service: "properties.company.value",
    hull: "traits_hubspot/company",
    overwrite: true
  },
  {
    service: "properties.hubspot_owner_id.value",
    hull: "traits_hubspot/hubspot_owner_id",
    overwrite: true
  },
  {
    service: "properties.country.value",
    hull: "traits_hubspot/address_country",
    overwrite: true
  },
  {
    service: "properties.createdate.value",
    hull: "traits_hubspot/created_at",
    overwrite: true
  },
  {
    service: "properties.days_to_close.value",
    hull: "traits_hubspot/days_to_close",
    overwrite: true
  },
  {
    service: "properties.fax.value",
    hull: "traits_hubspot/fax",
    overwrite: true
  },
  {
    service: "properties.first_deal_created_date.value",
    hull: "traits_hubspot/first_deal_created_at",
    overwrite: true
  },
  {
    service: "properties.firstname.value",
    hull: "traits_hubspot/first_name",
    overwrite: true
  },
  {
    service: "properties.industry.value",
    hull: "traits_hubspot/industry",
    overwrite: true
  },
  {
    service: "properties.jobtitle.value",
    hull: "traits_hubspot/job_title",
    overwrite: true
  },
  {
    service: "properties.notes_last_updated.value",
    hull: "traits_hubspot/last_activity_at",
    overwrite: true
  },
  {
    service: "properties.notes_last_contacted.value",
    hull: "traits_hubspot/notes_last_contacted_at",
    overwrite: true
  },
  {
    service: "properties.lastmodifieddate.value",
    hull: "traits_hubspot/updated_at",
    overwrite: true
  },
  {
    service: "properties.lastname.value",
    hull: "traits_hubspot/last_name",
    overwrite: true
  },
  {
    service: "properties.hs_lead_status.value",
    hull: "traits_hubspot/lead_status",
    overwrite: true
  },
  {
    service: "properties.lifecyclestage.value",
    hull: "traits_hubspot/lifecycle_stage",
    overwrite: true
  },
  {
    service: "properties.hs_email_bounce.value",
    hull: "traits_hubspot/emails_bounced_count",
    overwrite: true
  },
  {
    service: "properties.hs_email_open.value",
    hull: "traits_hubspot/opened_count",
    overwrite: true
  },
  {
    service: "properties.message.value",
    hull: "traits_hubspot/message",
    overwrite: true
  },
  {
    service: "properties.mobilephone.value",
    hull: "traits_hubspot/mobile_phone",
    overwrite: true
  },
  {
    service: "properties.notes_next_activity_date.value",
    hull: "traits_hubspot/next_activity_at",
    overwrite: true
  },
  {
    service: "properties.numemployees.value",
    hull: "traits_hubspot/employees_count",
    overwrite: true
  },
  {
    service: "properties.num_notes.value",
    hull: "traits_hubspot/notes_count",
    overwrite: true
  },
  {
    service: "properties.num_contacted_notes.value",
    hull: "traits_hubspot/contacted_notes_count",
    overwrite: true
  },
  {
    service: "properties.hubspot_owner_assigneddate.value",
    hull: "traits_hubspot/owner_assigned_at",
    overwrite: true
  },
  {
    service: "properties.phone.value",
    hull: "traits_hubspot/phone",
    overwrite: true
  },
  {
    service: "properties.zip.value",
    hull: "traits_hubspot/address_postal_code",
    overwrite: true
  },
  {
    service: "properties.recent_deal_amount.value",
    hull: "traits_hubspot/recent_deal_amount",
    overwrite: true
  },
  {
    service: "properties.recent_deal_close_date.value",
    hull: "traits_hubspot/recent_deal_closed_at",
    overwrite: true
  },
  {
    service: "properties.salutation.value",
    hull: "traits_hubspot/salutation",
    overwrite: true
  },
  {
    service: "properties.state.value",
    hull: "traits_hubspot/address_state",
    overwrite: true
  },
  {
    service: "properties.address.value",
    hull: "traits_hubspot/address_street",
    overwrite: true
  },
  {
    service: "properties.total_revenue.value",
    hull: "traits_hubspot/total_revenue",
    overwrite: true
  },
  {
    service: "properties.hs_email_optout.value",
    hull: "traits_hubspot/email_optout",
    overwrite: true
  },
  {
    service: "properties.website.value",
    hull: "traits_hubspot/website",
    overwrite: true
  }
];

module.exports = {
  defaultContactAttributes
};
