import _ from "lodash";

function executeFallbackStrategy(dataObject, attributeName, strategy) {
  _.forEach(strategy, s => {
    if (!_.isNil(_.get(s.dataObject, s.attribute, null))) {
      _.set(dataObject, attributeName, _.get(s.dataObject, s.attribute));
    }
  });
}

export default async function handle({
  hull,
  user,
  // segments,
  account,
  // account_segments,
  // changes,
  events
  // private_settings
}) {
  const userTraits = {};
  // Company Name
  if (
    _.get(user, "unified_data.company_name", null) === null ||
    user.email === "jeff@beachhousegrp.com"
  ) {
    const companyNameFallbacks = [
      { dataObject: account, attribute: "name" },
      { dataObject: account, attribute: "clearbit.name" },
      { dataObject: account, attribute: "datanyze.name" },
      { dataObject: user, attribute: "clearbit_company.name" },
      { dataObject: user, attribute: "clearbit.employment_name" },
      { dataObject: account, attribute: "domain" },
      { dataObject: user, attribute: "traits.demo_request_company" }
    ];

    executeFallbackStrategy(
      userTraits,
      "unified_data/company_name",
      companyNameFallbacks
    );
  }
  // Title
  if (
    _.get(user, "unified_data.job_title", null) === null ||
    (_.get(user, "salesforce_contact.title", null) !== null &&
      _.get(user, "unified_data.job_title", null) !==
        _.get(user, "salesforce_contact.title", null))
  ) {
    const jobTitleFallbacks = [
      { dataObject: user, attribute: "salesforce_contact.title" },
      { dataObject: user, attribute: "clearbit.employment_title" }
    ];

    executeFallbackStrategy(
      userTraits,
      "unified_data/job_title",
      jobTitleFallbacks
    );
  }

  // Last Name
  if (
    _.get(user, "last_name", null) !==
      _.get(user, "salesforce_lead.last_name", null) &&
    _.get(user, "salesforce_lead.last_name", null) &&
    !_.get(user, "salesforce_contact.id", null)
  ) {
    _.set(user, "last_name", _.get(user, "salesforce_lead.last_name"));
  }

  // Phone
  if (_.get(user, "unified_data.phone", null) === null) {
    const phoneFallbacks = [
      { dataObject: user, attribute: "phone" },
      { dataObject: user, attribute: "traits.demo_request_phone" }
    ];

    executeFallbackStrategy(userTraits, "unified_data/phone", phoneFallbacks);
  }
  // Website
  if (
    _.get(user, "unified_data.website", null) === null ||
    user.email === "echernishev@datanyze.com"
  ) {
    const websiteFallbacks = [
      { dataObject: account, attribute: "domain" },
      { dataObject: account, attribute: "clearbit.domain" },
      { dataObject: account, attribute: "datanyze.domain" },
      { dataObject: user, attribute: "intercom.company_website" },
      { dataObject: user, attribute: "traits.demo_request_company" },
      { dataObject: user, attribute: "domain" },
      { dataObject: user, attribute: "clearbit_company.domain" },
      { dataObject: user, attribute: "datanyze.domain" }
    ];

    executeFallbackStrategy(
      userTraits,
      "unified_data/website",
      websiteFallbacks
    );
  }
  // SIC Code
  if (_.get(user, "unified_data.sic_code", null) === null) {
    const sicFallbacks = [
      { dataObject: account, attribute: "clearbit.category_sic_code" },
      { dataObject: account, attribute: "datanyze.sic_code" },
      { dataObject: user, attribute: "clearbit_company.category_sic_code" },
      { dataObject: user, attribute: "datanyze.sic_code" }
    ];
    executeFallbackStrategy(userTraits, "unified_data/sic_code", sicFallbacks);
  }
  // NAICS Code
  if (_.get(user, "unified_data.naics_code", null) === null) {
    const naicsFallbacks = [
      { dataObject: account, attribute: "clearbit.category_naics_code" },
      { dataObject: account, attribute: "datanyze.naics_code" },
      { dataObject: user, attribute: "clearbit_company.category_naics_code" },
      { dataObject: user, attribute: "datanyze.naics_code" }
    ];
    executeFallbackStrategy(
      userTraits,
      "unified_data/naics_code",
      naicsFallbacks
    );
  }
  // Use case from demo request
  if (_.get(user, "unified_data.demo_request_use_case", null) === null) {
    const demoUseCaseFallbacks = [
      { dataObject: user, attribute: "intercom.demo_request_use_case" },
      { dataObject: user, attribute: "traits.demo_request_use_case" }
    ];
    executeFallbackStrategy(
      userTraits,
      "unified_data/demo_request_use_case",
      demoUseCaseFallbacks
    );
  }
  // Technologies
  if (_.get(user, "unified_data.technologies", null) === null) {
    const techFallbacks = [
      { dataObject: account, attribute: "datanyze.technologies" },
      { dataObject: account, attribute: "clearbit.tech" },
      { dataObject: user, attribute: "datanyze.technologies" },
      { dataObject: user, attribute: "clearbit_company.tech" }
    ];
    executeFallbackStrategy(
      userTraits,
      "unified_data/technologies",
      techFallbacks
    );
  }
  // Address Street
  if (_.get(user, "unified_data.address_street", null) === null) {
    const cbStreetName = _.get(account, "clearbit.geo_street_name", null);
    const cbStreetNumber = _.get(account, "clearbit.geo_street_number", null);
    if (
      cbStreetName &&
      cbStreetNumber &&
      _.get(account, "clearbit.location", null)
    ) {
      // obtain the properly formatted street address from location
      _.set(
        userTraits,
        "unified_data/address_street",
        _.get(account, "clearbit.location", "").split(",")[0]
      );
    }
  }
  // Address ZIP/Postal Code
  if (_.get(user, "unified_data.address_postal_code", null) === null) {
    const zipFallbacks = [
      { dataObject: account, attribute: "clearbit.geo_postal_code" },
      { dataObject: user, attribute: "clearbit_company.geo_postal_code" }
    ];
    executeFallbackStrategy(
      userTraits,
      "unified_data/address_postal_code",
      zipFallbacks
    );
  }
  // Address City
  if (_.get(user, "unified_data.address_city", null) === null) {
    const cityFallbacks = [
      { dataObject: account, attribute: "clearbit.geo_city" },
      { dataObject: account, attribute: "datanyze.city" },
      { dataObject: user, attribute: "clearbit_company.geo_city" },
      { dataObject: user, attribute: "datanyze.city" }
    ];
    executeFallbackStrategy(
      userTraits,
      "unified_data/address_city",
      cityFallbacks
    );
  }
  // Address State
  if (_.get(user, "unified_data.address_state", null) === null) {
    const stateFallbacks = [
      { dataObject: account, attribute: "clearbit.geo_state" },
      { dataObject: account, attribute: "datanyze.state_name" },
      { dataObject: user, attribute: "clearbit_company.geo_state" },
      { dataObject: user, attribute: "datanyze.state_name" }
    ];
    executeFallbackStrategy(
      userTraits,
      "unified_data/address_state",
      stateFallbacks
    );
  }
  // Address Country
  if (_.get(user, "unified_data.address_country", null) === null) {
    const stateFallbacks = [
      { dataObject: account, attribute: "clearbit.geo_country" },
      { dataObject: account, attribute: "datanyze.country_name" },
      { dataObject: user, attribute: "clearbit_company.geo_country" },
      { dataObject: user, attribute: "datanyze.country_name" }
    ];
    executeFallbackStrategy(
      userTraits,
      "unified_data/address_country",
      stateFallbacks
    );
  }

  // Metrics - Employees Count
  if (_.get(user, "unified_data.metrics_employee_count", null) === null) {
    const empCountFallbacks = [
      { dataObject: account, attribute: "clearbit.metrics_employees" },
      { dataObject: user, attribute: "clearbit_company.metrics_employees" }
    ];
    executeFallbackStrategy(
      userTraits,
      "unified_data/metrics_employee_count",
      empCountFallbacks
    );
  }

  // Lead Source
  if (_.get(user, "unified_data.lead_source", null) === null) {
    const demoRequest = _.get(user, "traits.demo_request_email", null) !== null;
    const driftSource = _.get(user, "traits.drift_email", null) !== null;
    const tradeShowCampaign = _.get(user, "traits.campaign", null) !== null;

    if (demoRequest) {
      _.set(userTraits, "unified_data/lead_source", "demo_request");
      _.set(userTraits, "unified_data/lead_source_sfdc", "Demo Request");
    } else if (driftSource) {
      _.set(userTraits, "unified_data/lead_source", "drift");
      _.set(userTraits, "unified_data/lead_source_sfdc", "Live Chat");
    } else if (tradeShowCampaign) {
      _.set(
        userTraits,
        "unified_data/lead_source",
        _.get(user, "traits.campaign")
      );
      _.set(userTraits, "unified_data/lead_source_sfdc", "Trade Show");
    }
  }

  // Hull Link - No fallback
  if (_.get(user, "unified_data.hull_link", null) === null) {
    _.set(
      userTraits,
      "unified_data/hull_link",
      `https://dashboard.hullapp.io/super/users/${user.id}`
    );
  }

  // LinkedIn - No fallback
  if (
    _.get(user, "unified_data.linkedin_profile", null) === null &&
    _.get(user, "clearbit.linkedin_handle", null) !== null
  ) {
    const userHandle = _.get(user, "clearbit.linkedin_handle");
    _.set(
      userTraits,
      "unified_data/linkedin_profile",
      `https://www.linkedin.com/${userHandle}`
    );
  }

  // Salesforce Contact - Customer info
  if (
    _.get(user, "salesforce_contact.first_name", null) !== null &&
    _.get(user, "salesforce_contact.first_name", null) !==
      _.get(user, "first_name", "") &&
    (_.get(user, "salesforce_contact.contact_status", "n/a") === "Trial" ||
      _.get(user, "salesforce_contact.contact_status", "n/a") === "Customer")
  ) {
    _.set(
      userTraits,
      "first_name",
      _.get(user, "salesforce_contact.first_name")
    );
  }
  if (
    _.get(user, "salesforce_contact.last_name", null) !== null &&
    _.get(user, "salesforce_contact.last_name", null) !==
      _.get(user, "last_name", "") &&
    (_.get(user, "salesforce_contact.contact_status", "n/a") === "Trial" ||
      _.get(user, "salesforce_contact.contact_status", "n/a") === "Customer")
  ) {
    _.set(userTraits, "last_name", _.get(user, "salesforce_contact.last_name"));
  }

  // Demo request
  if (
    _.get(user, "intercom.demo_request_use_case", null) &&
    _.get(user, "intercom.email")
  ) {
    if (
      !_.get(userTraits, "unified_data/company_name", null) &&
      !_.get(user, "unified_data.company_name", null)
    ) {
      _.set(userTraits, "unified_data/company_name", "[Unknown]");
    }

    if (
      !_.get(userTraits, "last_name", null) &&
      !_.get(user, "last_name", null)
    ) {
      _.set(userTraits, "last_name", "[Unknown]");
    }
  }

  // Filter demo booked events from calendly
  const demoBookedEvents = _.filter(events, { event: "Demo booked" });
  if (demoBookedEvents.length > 0) {
    const demoBooked = _.first(demoBookedEvents);
    _.set(userTraits, "unified_data/demo_request_use_case", {
      value: _.get(demoBooked, "properties.demo_use_case"),
      operation: "setIfNull"
    });
    _.set(userTraits, "unified_data/company_name", {
      value: _.get(demoBooked, "properties.demo_company_website"),
      operation: "setIfNull"
    });
    _.set(userTraits, "unified_data/phone", {
      value: _.get(demoBooked, "properties.demo_phone_number"),
      operation: "setIfNull"
    });
    _.set(userTraits, "unified_data/email", {
      value: _.get(demoBooked, "properties.demo_email"),
      operation: "setIfNull"
    });
    _.set(userTraits, "unified_data/demo_booked_at", {
      value: _.get(demoBooked, "created_at"),
      operation: "setIfNull"
    });
  }

  // SaaStr 2019 Leads
  if (
    _.get(user, "hubspot.campaign", null) === "saastr2019" &&
    _.get(user, "unified_data.lead_source", null) === null
  ) {
    _.set(
      userTraits,
      "unified_data/lead_source",
      _.get(user, "hubspot.campaign")
    );
    _.set(userTraits, "unified_data/lead_source_sfdc", "Trade Show");
    if (_.get(user, "hubspot.use_case", null) !== null) {
      _.set(userTraits, "unified_data/demo_request_use_case", {
        value: _.get(user, "hubspot.use_case"),
        operation: "setIfNull"
      });
    }
  }

  // Added by romain to parse the `newsletter_email` attributes coming from the website.
  const { newsletter_email } = user.traits || {};
  if (!!newsletter_email && !userTraits.email && !user.email) {
    userTraits.email = {
      operation: "setIfNull",
      value: newsletter_email
    };
  }

  // Added by romain to extract an Anonymous ID we can use in emails for Tracking
  const match_id = _.first(
    _.filter(user.anonymous_ids, id => !/[:|@]/.test(id))
  );
  if (match_id) {
    userTraits.match_id = match_id;
  }

  hull.traits(userTraits);
}
