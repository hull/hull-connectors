// @flow

const _ = require("lodash");
const { Client } = require("hull");
const { superagentUrlTemplatePlugin } = require("hull/src/utils");
const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");

const ships = [
  {
    ship: "",
    secret: "",
    organization: ""
  }
];

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

function isAttributeHullManaged(hubspotProperties, attributeName) {
  const hubspotContactProperty = _.find(hubspotProperties, {
    name: attributeName
  });

  const hullManagedContactProperty = _.find(hubspotProperties, {
    name: `hull_${attributeName}`
  });

  return (
    _.isNil(hubspotContactProperty) ||
    (!_.isNil(hullManagedContactProperty) &&
      hullManagedContactProperty.groupName === "hull")
  );
}

function transformIncomingClaims(incoming_claims) {
  const original_claims = _.cloneDeep(incoming_claims);

  // leave claims alone
  return original_claims;
}
function transformIncomingAttributes(
  entity,
  incoming_attributes,
  defaultAttributeMapping
) {
  const custom_attributes = [];
  const new_attributes = _.cloneDeep(incoming_attributes).map(attr => {
    return {
      service: `properties.${attr.service}.value`,
      hull: attr.hull,
      overwrite: true
    };
  });

  if (entity === "user") {
    custom_attributes.push({
      service: "`canonical-vid` ? `canonical-vid` : `vid`",
      hull: "traits_hubspot/id",
      readOnly: true,
      overwrite: true
    });
    custom_attributes.push({
      service: "properties.email.value",
      hull: "traits_hubspot/email",
      readOnly: true,
      overwrite: true
    });

    const existingMergedVidMapping = _.remove(
      new_attributes,
      attr => attr.service === "properties.contact_meta.merged-vids.value"
    );
    if (!_.isNil(existingMergedVidMapping)) {
      custom_attributes.push({
        service: "`merged-vids`",
        hull: existingMergedVidMapping.hull,
        overwrite: true
      });
    }
  }

  if (entity === "account") {
    custom_attributes.push({
      service: "properties.hs_object_id.value",
      hull: "hubspot/id",
      readOnly: true,
      overwrite: true
    });

    custom_attributes.push({
      service: "properties.domain.value",
      hull: "hubspot/domain",
      readOnly: true,
      overwrite: true
    });
  }

  _.forEach(defaultAttributeMapping, defaultMapping => {
    const existingAttribute = _.find(
      new_attributes,
      attr => attr.service === defaultMapping.service
    );

    if (_.isNil(existingAttribute)) {
      new_attributes.push({
        service: defaultMapping.service,
        hull: defaultMapping.hull,
        overwrite: true
      });
    }
  });

  return [...custom_attributes, ...new_attributes];
}

async function transformOutgoingAttributes(
  entity,
  outgoing_attributes,
  hubspotProperties
) {
  const custom_attributes = [];
  const new_attributes = _.cloneDeep(outgoing_attributes).map(attr => {
    const isHullManaged = isAttributeHullManaged(
      hubspotProperties,
      attr.service
    );

    const serviceAttr = isHullManaged ? `hull_${attr.service}` : attr.service;

    return {
      service: serviceAttr,
      hull: attr.hull,
      overwrite: true
    };
  });

  if (entity === "user") {
    custom_attributes.push({
      service: "hull_segments",
      hull: "segments.name[]",
      readyOnly: true,
      overwrite: true
    });
  }

  if (entity === "account") {
    custom_attributes.push({
      service: "hull_segments",
      hull: "account_segments.name[]",
      readyOnly: true,
      overwrite: true
    });
  }
  return [...custom_attributes, ...new_attributes];
}

let new_incoming_user_claims;
let new_incoming_account_claims;
let new_incoming_user_attributes;
let new_incoming_account_attributes;
let new_outgoing_user_attributes;
let new_outgoing_account_attributes;

async function getContactPropertyGroups(hubspotAgent) {
  return hubspotAgent
    .get("/contacts/v2/groups")
    .query({
      includeProperties: true
    })
    .then(response => response.body);
}

async function getCompanyPropertyGroups(hubspotAgent) {
  return hubspotAgent
    .get("/properties/v1/companies/groups")
    .query({
      includeProperties: true
    })
    .then(response => response.body);
}

(async () => {
  _.forEach(ships, async ship => {
    const hullClient = new Client({
      id: ship.ship,
      secret: ship.secret,
      organization: ship.organization
    });

    hullClient.get("app").then(async connector => {
      const private_settings = _.cloneDeep(connector.private_settings);
      const {
        incoming_user_claims = [],
        incoming_user_attributes = [],
        outgoing_user_attributes = [],
        incoming_account_claims = [],
        incoming_account_attributes = [],
        outgoing_account_attributes = [],
        token
      } = private_settings;

      const hubspotAgent = superagent
        .agent()
        .use(superagentUrlTemplatePlugin({}))
        .use(prefixPlugin("https://api.hubapi.com"))
        .set("Authorization", `Bearer ${token}`)
        .timeout({
          response: 10000
        });

      const hubspotContactGroups = await getContactPropertyGroups(hubspotAgent);
      const hubspotCompanyGroups = await getCompanyPropertyGroups(hubspotAgent);

      const hubspotContactProperties = _.flatten(
        hubspotContactGroups.map(group => group.properties)
      );

      const hubspotCompanyProperties = _.flatten(
        hubspotCompanyGroups.map(group => group.properties)
      );
      new_incoming_user_claims = transformIncomingClaims(incoming_user_claims);

      new_incoming_account_claims = transformIncomingClaims(
        incoming_account_claims
      );

      new_incoming_user_attributes = transformIncomingAttributes(
        "user",
        incoming_user_attributes,
        defaultContactAttributes
      );
      new_incoming_account_attributes = transformIncomingAttributes(
        "account",
        incoming_account_attributes,
        defaultAccountAttributes
      );
      new_outgoing_user_attributes = await transformOutgoingAttributes(
        "user",
        outgoing_user_attributes,
        hubspotContactProperties
      );
      new_outgoing_account_attributes = await transformOutgoingAttributes(
        "account",
        outgoing_account_attributes,
        hubspotCompanyProperties
      );

      const newPrivateSettings = {
        ...private_settings,
        incoming_user_claims: new_incoming_user_claims,
        incoming_user_attributes: new_incoming_user_attributes,
        outgoing_user_attributes: new_outgoing_user_attributes,
        incoming_account_claims: new_incoming_account_claims,
        incoming_account_attributes: new_incoming_account_attributes,
        outgoing_account_attributes: new_outgoing_account_attributes
      };

      return hullClient.utils.settings.update(newPrivateSettings);
    });
  });
})();

console.log("Done");
