/* global describe, test, expect */
const _ = require("lodash");
const expect = require("expect");

const { createAttributeName, AttributesMapper } = require("../../server/lib/sync-agent/attributes-mapper");

describe("createAttributeName", () => {
  it("should convert CamelCase fields from Salesforce into snake_case", () => {
    const str = "traits_salesforce/first_name";
    const expected = "salesforce/first_name";

    const actual = createAttributeName("salesforce", str);
    expect(actual).toBe(expected);
  });

  it("should convert Salesforce fields ending with __c into snake_case attributes without __c", () => {
    const str = "traits_salesforce/ext_id";
    const expected = "salesforce/ext_id";

    const actual = createAttributeName("salesforce", str);
    expect(actual).toBe(expected);
  });

  it("should convert Salesforce fields ending with Created into snake_case attributes without _created_at", () => {
    const str = "traits_salesforce/subscription_created";
    const expected = "salesforce/subscription_created_at";

    const actual = createAttributeName("salesforce", str);
    expect(actual).toBe(expected);
  });

  it("should convert Salesforce fields ending with Created__c into snake_case attributes without _created_at", () => {
    const str = "traits_salesforce/subscription_created";
    const expected = "salesforce/subscription_created_at";

    const actual = createAttributeName("salesforce", str);
    expect(actual).toBe(expected);
  });
});

describe("AttributesMapper", () => {
  const CONNECTOR_SETTINGS = {
    lead_attributes_outbound: [
      { hull: "first_name", service: "FirstName", overwrite: true },
      { hull: "last_name", service: "LastName", overwrite: true },
      { hull: "email", service: "Email", overwrite: true },
      { hull: "account._sales_business_won", service: "business_won__c", overwrite: true },
      { hull: "traits_clearbit/industry", service: "Industry__c", overwrite: false },
      { hull: "traits_status", service: "Status", overwrite: true },
      { hull: "traits_intercom/citygroup", service: "City", overwrite: true },
      { hull: "traits_company", service: "Company", overwrite: true }
    ],
    contact_attributes_outbound: [
      { hull: "first_name", service: "FirstName", overwrite: true },
      { hull: "last_name", service: "LastName", overwrite: true },
      { hull: "email", service: "Email", overwrite: true },
      { hull: "account._sales_business_won", service: "business_won__c", overwrite: true },
      { hull: "traits_clearbit/industry", service: "Industry__c", overwrite: false },
      { hull: "traits_status", service: "Status", overwrite: true },
      { hull: "traits_intercom/citygroup", service: "City", overwrite: true },
      { hull: "traits_company", service: "Company", overwrite: true }
    ],
    account_attributes_outbound: [
      { hull: "domain",
        service: "Website",
        overwrite: false },
      { hull: "name",
        service: "Name",
        overwrite: false },
      { hull: "mrr",
        service: "MRR__c",
        overwrite: true },
      { hull: "employees",
        service: "NumberOfEmployees",
        overwrite: false }
    ],
    lead_attributes_inbound: [
      { service: "FirstName",
        hull: "traits_salesforce_lead/first_name",
        overwrite: false },
      { service: "Company",
        hull: "traits_salesforce_lead/company",
        overwrite: false },
      { service: "Status",
        hull: "traits_salesforce_lead/status",
        overwrite: false }
    ],
    account_attributes_inbound: [
      { service: "Name",
        hull: "salesforce/name",
        overwrite: false },
      { service: "Website",
        hull: "salesforce/website",
        overwrite: false },
      { service: "CustomerPriority__c",
        hull: "salesforce/customer_priority",
        overwrite: false }
    ],
    account_claims: [
      {
        hull: "domain",
        service: "Website",
        required: true
      },
      {
        hull: "external_id",
        service: "CustomField1",
        required: true
      }
    ],
  };

  it("should map a Hull user to a Salesforce lead object", () => {
    const hullUser = {
      account: {
        created_at: "2017-10-25T10:06:00Z",
        domain: "hullsfdc.io",
        employees: 2,
        external_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
        industry: "Technology",
        name: "Hull SFDC Testing",
        plan: "Enterprise",
        _sales_business_won: "2017-10-25T12:45:00Z"
      },
      id: "59f06a5f421a978e920643d7",
      created_at: "2017-10-25T10:41:35Z",
      is_approved: false,
      has_password: false,
      accepts_marketing: false,
      email: "sven+sfdc4@hull.io",
      domain: "hull.io",
      name: "Svn4 SFDC",
      last_name: "SFDC",
      first_name: "Svn4",
      status: "Lead",
      "intercom/citygroup": "Stuttgart",
      company: "Hull Test SFDC GmbH & Co KG",
      "salesforce_lead/id": "abcdf",
      "salesforce_contact/id": "1234foo",
      "salesforce/id": "56789baz",
      last_source_timestamp: ""
    };

    const segments = [
      {
        id: "1",
        name: "first segment",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      },
      {
        id: "2",
        name: "second segment",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      }
    ];

    const accountSegments = [
      {
        id: "1",
        name: "first account segment",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      },
      {
        id: "2",
        name: "second account segment",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      }
    ];

    const expectedSfObject = {
      FirstName: hullUser.first_name,
      LastName: hullUser.last_name,
      Email: hullUser.email,
      business_won__c: hullUser.account._sales_business_won,
      LeadAccountSegmentsField: "first account segment;second account segment",
      LeadSegmentsField: "first segment;second segment",
      Status: hullUser.status,
      City: hullUser["intercom/citygroup"],
      Company: hullUser.company,
      Id: "abcdf"
    };

    const connectorSettings = _.cloneDeep(CONNECTOR_SETTINGS);
    _.set(connectorSettings, "lead_outgoing_user_segments", "LeadSegmentsField");
    _.set(connectorSettings, "lead_outgoing_account_segments", "LeadAccountSegmentsField");
    _.set(connectorSettings, "contact_outgoing_user_segments", "ContactSegmentsField");
    _.set(connectorSettings, "contact_outgoing_account_segments", "ContactAccountSegmentsField");
    _.set(connectorSettings, "account_outgoing_account_segments", "AccountSegmentsField");
    const mapper = new AttributesMapper(connectorSettings);
    const sObject = mapper.mapToServiceObject("Lead", hullUser, segments, accountSegments);

    expect(sObject).toEqual(expectedSfObject);
  });

  it("should map a Hull user to a Salesforce contact object with an associated account id", () => {
    const hullUser = {
      account: {
        created_at: "2017-10-25T10:06:00Z",
        domain: "hullsfdc.io",
        employees: 2,
        external_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
        industry: "Technology",
        name: "Hull SFDC Testing",
        plan: "Enterprise",
        _sales_business_won: "2017-10-25T12:45:00Z"
      },
      id: "59f06a5f421a978e920643d7",
      created_at: "2017-10-25T10:41:35Z",
      is_approved: false,
      has_password: false,
      accepts_marketing: false,
      email: "sven+sfdc4@hull.io",
      domain: "hull.io",
      name: "Svn4 SFDC",
      last_name: "SFDC",
      first_name: "Svn4",
      status: "Lead",
      "intercom/citygroup": "Stuttgart",
      company: "Hull Test SFDC GmbH & Co KG",
      "salesforce_lead/id": "abcdf",
      "salesforce_contact/id": "1234foo",
      "salesforce/id": "56789baz",
      "salesforce_contact/account_id": "145bCvou="
    };

    const expectedSfObject = {
      FirstName: hullUser.first_name,
      LastName: hullUser.last_name,
      Email: hullUser.email,
      business_won__c: hullUser.account._sales_business_won,
      Status: hullUser.status,
      City: hullUser["intercom/citygroup"],
      Company: hullUser.company,
      Id: hullUser["salesforce_contact/id"],
      AccountId: hullUser["salesforce_contact/account_id"]
    };

    const mapper = new AttributesMapper(CONNECTOR_SETTINGS);
    const sObject = mapper.mapToServiceObject("Contact", hullUser, [], []);

    expect(sObject).toEqual(expectedSfObject);
  });

  it("should map a Hull account to a Salesforce Account Object", () => {
    const hullAccount = {
      created_at: "2017-10-25T10:06:00Z",
      domain: "hullsfdc.io",
      external_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
      industry: "Technology",
      name: "Hull SFDC Testing",
      plan: "Enterprise",
      _sales_business_won: "2017-10-25T12:45:00Z",
      mrr: 34567,
      "salesforce/id": "0012F000007ydmWQAQ"
    };

    const expectedSfObject = {
      CustomField1: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
      Id: hullAccount["salesforce/id"],
      Name: hullAccount.name,
      Website: hullAccount.domain,
      MRR__c: hullAccount.mrr
    };

    const mapper = new AttributesMapper(CONNECTOR_SETTINGS);
    const sObject = mapper.mapToServiceObject("Account", hullAccount, [], []);

    expect(sObject).toEqual(expectedSfObject);
  });

  it("should map a Salesforce lead object to a Hull user", async () => {
    const sObject = {
      Id: "0012F000007ydmWQAQ",
      FirstName: "Sven3",
      LastName: "SFDC",
      Company: "Hull Test SFDC GmbH & Co KG",
      Status: "Sales Qualified Lead"
    };

    const expectedHullObject = {
      first_name: { value: sObject.FirstName, operation: "setIfNull" },
      "salesforce_lead/first_name": { operation: "set", value: sObject.FirstName },
      "salesforce_lead/company": { operation: "set", value: sObject.Company },
      "salesforce_lead/status": { operation: "set", value: sObject.Status },
      "salesforce_lead/id": { value: sObject.Id, operation: "setIfNull" }
    };

    const mapper = new AttributesMapper(CONNECTOR_SETTINGS);

    const hObject = await mapper.mapToHullAttributeObject("Lead", sObject);

    expect(hObject).toEqual(expectedHullObject);
  });

  it("should map a Salesforce account object to a Hull account", async () => {
    const sObject = {
      Id: "0012F000007ydmWQAQ",
      Name: "Hull SFDC Company",
      Website: "hullsfdc.com",
      CustomerPriority__c: "High"
    };

    const expectedHullObject = {
      name: { value: sObject.Name, operation: "setIfNull" },
      domain: { value: sObject.Website, operation: "setIfNull" },
      "salesforce/id": { value: sObject.Id, operation: "setIfNull" },
      "salesforce/name": { operation: "set", value: sObject.Name },
      "salesforce/website": { operation: "set", value: sObject.Website },
      "salesforce/customer_priority": { operation: "set", value: sObject.CustomerPriority__c }
    };

    const mapper = new AttributesMapper(CONNECTOR_SETTINGS);

    const hObject = await mapper.mapToHullAttributeObject("Account", sObject);

    expect(hObject).toEqual(expectedHullObject);
  });

  it("should map a Salesforce lead to its ident object", () => {
    const sObject = {
      Id: "0012F000007ydmWQAQ",
      FirstName: "Sven3",
      LastName: "SFDC",
      Company: "Hull Test SFDC GmbH & Co KG",
      Status: "Sales Qualified Lead",
      Email: "sven3+sfdc@hull.io"
    };

    const expectedHullObject = {
      email: sObject.Email,
      anonymous_id: `salesforce-lead:${sObject.Id}`
    };

    const mapper = new AttributesMapper(CONNECTOR_SETTINGS);
    const hObject = mapper.mapToHullIdentObject("Lead", sObject);

    expect(hObject).toEqual(expectedHullObject);
  });

  it("should map a Salesforce account to its ident object", () => {
    const sObject = {
      Id: "0012F000007ydmWQAQ",
      Name: "Hull SFDC Company",
      Website: "hullsfdc.com",
      CustomerPriority__c: "High"
    };

    const expectedHullObject = {
      domain: sObject.Website,
      anonymous_id: `salesforce:${sObject.Id}`
    };

    const mapper = new AttributesMapper(CONNECTOR_SETTINGS);

    const hObject = mapper.mapToHullIdentObject("Account", sObject);

    expect(hObject).toEqual(expectedHullObject);
  });

  it("should map a user to a complex contact", () => {
    const mappings = [
      { hull: "first_name",
        service: "FirstName",
        overwrite: false },
      { hull: "last_name",
        service: "LastName",
        overwrite: false },
      { hull: "email",
        service: "Email",
        overwrite: false },
      { hull: "traits_role",
        service: "Role__c",
        overwrite: true },
      { hull: "traits_last_valid_url",
        service: "Last_Valid_URL__c",
        overwrite: true },
      { hull: "traits_total_users_active",
        service: "Users__c",
        overwrite: true },
      { hull: "traits_last_message_sent_at",
        service: "Last_Message__c",
        overwrite: true },
      { hull: "traits_yesterday_conversations",
        service: "Yesterday_Conversations__c",
        overwrite: true },
      { hull: "traits_active_contacts",
        service: "Active_Contacts__c",
        overwrite: true },
      { hull: "traits_total_conversations_chat",
        service: "chats__c",
        overwrite: true },
      { hull: "traits_lastweek_conversations",
        service: "Last_Week_Conversations__c",
        overwrite: true },
      { hull: "traits_lastweek_convo_growth",
        service: "Last_Week_Convo_Growth__c",
        overwrite: true },
      { hull: "traits_lastmonth_conversations",
        service: "Last_Month_Conversations__c",
        overwrite: true },
      { hull: "traits_lastmonth_convo_growth",
        service: "Last_Month_Convo_Growth__c",
        overwrite: true },
      { hull: "traits_yesterday_convo_growth",
        service: "Yesterday_Convo_Growth__c",
        overwrite: true },
      { hull: "traits_number_of_integrations",
        service: "integrations__c",
        overwrite: true },
      { hull: "traits_billing_last_visit",
        service: "Last_visited_upgrade_page__c",
        overwrite: true },
      { hull: "traits_billing_page_visits",
        service: "Number_of_visits_to_upgrade_page__c",
        overwrite: true },
      { hull: "traits_pricing_last_visit",
        service: "Last_visited_pricing_page__c",
        overwrite: true },
      { hull: "traits_pricing_page_visits",
        service: "Number_of_visits_to_pricing_page__c",
        overwrite: true },
      { hull: "traits_last_seen_user",
        service: "last_seen__c",
        overwrite: true },
      { hull: "traits_convo_alert",
        service: "Convo_alert__c",
        overwrite: true },
      { hull: "traits_attribution/lead_source",
        service: "LeadSource",
        overwrite: false },
      { hull: "traits_attribution/lead_source_detail",
        service: "Lead_Detail__c",
        overwrite: false },
      { hull: "traits_attribution/lead_source_timestamp",
        service: "Source_Timestamp__c",
        overwrite: false },
      { hull: "traits_attribution/last_lead_source",
        service: "Latest_Lead_Source__c",
        overwrite: true },
      { hull: "traits_attribution/last_lead_source_detail",
        service: "Latest_Lead_Detail__c",
        overwrite: true },
      { hull: "traits_attribution/last_lead_source_timestamp",
        service: "Latest_Source_Timestamp__c",
        overwrite: true },
      { hull: "traits_datanyze/monthly_tech_spend",
        service: "Tech_Spend__c",
        overwrite: true },
      { hull: "traits_datanyze/revenue_str",
        service: "Datanyze_Revenue__c",
        overwrite: true },
      { hull: "traits_datanyze/total_money_raised",
        service: "Datanyze_Money_Raised__c",
        overwrite: true },
      { hull: "traits_cs_active_users",
        service: "CS_Active_Users__c",
        overwrite: true },
      { hull: "traits_playbooks_active",
        service: "Number_of_Playbooks_Active__c",
        overwrite: true },
      { hull: "traits_integrations_enabled",
        service: "Integrations_Enabled__c",
        overwrite: true }];

    const connectorSettings = {
      contact_attributes_outbound: mappings
    };
    const hObject = {
      id: "59fbcb5b641c10443804a528",
      created_at: "2017-11-03T01:50:19Z",
      email: "john_gi@exploremysticislands.com",
      domain: "exploremysticislands.com",
      name: "John Garibaldi",
      first_name: "John",
      last_name: "Garibaldi",
      picture: "https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/a12bcd34-5efg-434c-8ef9-1573f554dd4b",
      last_known_ip: "8.8.8.8",
      accepts_marketing: false,
      is_approved: false,
      has_password: false,
      external_id: "12345-98765",
      account_start_date: "2016-11-15T00:00:00+00:00",
      total_segments: 0,
      _offline: true,
      account_billing_contact_tier: 15000,
      account_billing_interval: "monthly",
      account_billing_price: 360,
      account_plan: "team_monthly_05_2017",
      account_type: "premium_plan",
      active_seats: 3,
      alias: "Team",
      chat_activated: "2016-11-16",
      creator_role: "marketing",
      fortnight_conversations: 0,
      fortnight_convo_growth: 0,
      integration_madkudu: false,
      integration_vidyard: false,
      last_updated_at: "2018-03-12T04:43:27+00:00",
      messenger_activated: false,
      monthly_active_users: 41,
      phone_number: "NA",
      signup_completed: false,
      total_active_campaigns: 2,
      total_active_campaigns_announcement_one_time: 1,
      total_active_campaigns_bot: 0,
      total_active_campaigns_chat: 0,
      total_active_campaigns_email_capture: 1,
      total_active_campaigns_nps_one_time: 0,
      total_active_campaigns_nps_recurring: 0,
      total_active_campaigns_with_targeting: 2,
      total_conversations_announcement: 10183,
      total_conversations_email: 44,
      total_conversations_email_capture: 303,
      total_conversations_nps_question: 0,
      total_users_active: 3,
      total_users_deleted: 0,
      total_users_invited: 0,
      twomonth_conversations: 7739,
      twomonth_convo_growth: 71.57926177978516,
      used_anonymous_chat: true,
      used_identified_chat: true,
      yesterday_conversations: 14864,
      yesterday_convo_growth: 0,
      billing_contact_tier: 15000,
      billing_coupons: [],
      billing_interval: "monthly",
      billing_plan: "team_monthly_05_2017",
      billing_plan_type: "ActiveContacts",
      billing_price: 360,
      billing_seats: 3,
      received_at: "2018-03-12T05:10:02Z",
      role: "OWNER",
      active_contacts: 284,
      last_message_sent_at: "2018-03-11T13:00:00Z",
      last_valid_url: "https://exploremysticislands.com/destinations",
      lastmonth_conversations: 9954,
      lastmonth_convo_growth: 49.326904296875,
      lastweek_conversations: 13954,
      lastweek_convo_growth: 6.52142763137817,
      org_id: 18457,
      total_conversations: 25581,
      total_conversations_chat: 15051,
      total_end_users: 11486,
      number_of_integrations: 1,
      conversations_during_lastweek: 11627,
      billing_last_visit: "2018-01-14T00:00:00.000Z",
      pricing_last_visit: "2018-02-15T00:00:00.000Z",
      widget_enabled: true,
      total_integrations: 3,
      billing_page_visits: 51,
      pricing_page_visits: 13,
      last_seen_user: "2018-03-08T00:00:00.000Z",
      pricing_last_visit_user: "2018-02-15T00:00:00.000Z",
      pricing_page_visits_user: 12,
      in_danger: false,
      convo_alert: true,
      competition: [],
      integration_googleanalytics: true,
      lead_details: "",
      last_lead_details: "",
      lead_source: "",
      clearbit_reveal_company_metrics_estimated_annual_revenue: "$1M-$10M",
      source_timestamp: "",
      last_source_timestamp: "",
      last_lead_source: "",
      playbooks_active: 1,
      total_message_count_via_slack: 0,
      integration_email: false,
      credit_card_type: "Visa",
      contacts: 15000,
      activation_date: "2017-03-01T04:07:15Z",
      mrr: "360",
      plan_name: "Team Monthly (May 2017)",
      clearbit_company_metrics_employees_range: "11-50",
      clearbit_company_metrics_estimated_annual_revenue: "$1M-$10M",
      subscription_id: "3bf6d836144137ec73b5974ae88dab83",
      seats: 3,
      credit_card_expiration: "7-2022",
      subscription_start_date: "2018-03-01T04:07:15Z",
      subscription_cycle: "1months",
      subscription_end_date: "2018-04-01T04:07:15Z",
      last_conversation_timestamp: "2017-12-19T15:12:31.068Z",
      cs_active_users: "19",
      integrations_enabled: "clearbit_enrichment,googleAnalytics,hubspot",
      has_free_leadbot: false,
      "datanyze/domain": "exploremysticislands.com",
      "datanyze/company_name": "Explore Mystic Islands",
      "datanyze/country": 236,
      "datanyze/state": 24,
      "datanyze/employees": 2,
      "datanyze/revenue": 2,
      "datanyze/public": 2,
      "datanyze/industry_id": 60,
      "datanyze/country_name": "United States",
      "datanyze/country_iso": "USA",
      "datanyze/state_name": "MN",
      "datanyze/employees_str": "25 - 100",
      "datanyze/revenue_str": "$1 - 10M",
      "datanyze/industry_name": "Human Resources",
      "datanyze/technologies": [
        "Google Analytics",
        "WordPress",
        "LinkedIn Display Ads",
        "HubSpot",
        "Disqus",
        "Adobe Typekit",
        "Google Font API",
        "YouTube",
        "SoundCloud Widget",
        "Vimeo",
        "Google Tag Manager",
        "Amazon Route 53",
        "G Suite",
        "AppNexus",
        "Gravity Forms",
        "Facebook Widget",
        "AddThis",
        "nginx",
        "Eventbrite",
        "Facebook Web Custom Audiences",
        "Facebook Pixel",
        "Google Universal Analytics",
        "HTML viewport meta element",
        "CSS device width",
        "CSS max width",
        "Gmail for business",
        "Twitter Ads",
        "login keywords",
        "CSS media",
        "CSS em font size",
        "Google Forms",
        "Facebook WCA pageview pixel",
        "Google Cloud Web Serving",
        "Drift",
        "jsDelivr",
        "Facebook Analytics",
        "Twitter Analytics",
        "MailChannels"
      ],
      "datanyze/monthly_tech_spend": "$5K - 20K",
      "datanyze/tags": [],
      "datanyze/fetched_at": "2018-02-25T11:20:19Z",
      "salesforce_contact/email": "john_gi@exploremysticislands.com",
      "salesforce_contact/first_name": "John",
      "salesforce_contact/last_name": "Garibaldi",
      "salesforce_contact/id": "0045800000TXlKNCA1",
      "salesforce_contact/account_id": "0037900000WuEMrCAN",
      "salesforce_contact/created_by_id": "00546000000QAUgCAO",
      "salesforce_contact/lead_source": "Growth",
      "salesforce_contact/owner_id": "00546000000OTLdAAO",
      "salesforce_contact/lead_detail": "Anonymous Drift Visit",
      "salesforce_contact/source_timestamp": "2018-01-16T05:00:00.000+0000"
    };

    const expectedSfObject = {
      Id: hObject["salesforce_contact/id"],
      AccountId: hObject["salesforce_contact/account_id"],
      FirstName: hObject.first_name,
      LastName: hObject.last_name,
      Email: hObject.email,
      Role__c: hObject.role,
      Last_Valid_URL__c: hObject.last_valid_url,
      Users__c: hObject.total_users_active,
      Last_Message__c: hObject.last_message_sent_at,
      Yesterday_Conversations__c: hObject.yesterday_conversations,
      Active_Contacts__c: hObject.active_contacts,
      chats__c: hObject.total_conversations_chat,
      Last_Week_Conversations__c: hObject.lastweek_conversations,
      Last_Week_Convo_Growth__c: hObject.lastweek_convo_growth,
      Last_Month_Conversations__c: hObject.lastmonth_conversations,
      Last_Month_Convo_Growth__c: hObject.lastmonth_convo_growth,
      Yesterday_Convo_Growth__c: hObject.yesterday_convo_growth,
      integrations__c: hObject.number_of_integrations,
      Last_visited_upgrade_page__c: hObject.billing_last_visit,
      Number_of_visits_to_upgrade_page__c: hObject.billing_page_visits,
      Last_visited_pricing_page__c: hObject.pricing_last_visit,
      Number_of_visits_to_pricing_page__c: hObject.pricing_page_visits,
      last_seen__c: hObject.last_seen_user,
      Convo_alert__c: hObject.convo_alert,
      Tech_Spend__c: hObject["datanyze/monthly_tech_spend"],
      Datanyze_Revenue__c: hObject["datanyze/revenue_str"],
      CS_Active_Users__c: hObject.cs_active_users,
      Number_of_Playbooks_Active__c: hObject.playbooks_active,
      Integrations_Enabled__c: hObject.integrations_enabled
    };

    const mapper = new AttributesMapper(connectorSettings);
    const sObject = mapper.mapToServiceObject("Contact", hObject, [], []);

    expect(sObject).toEqual(expectedSfObject);
  });

  it("should map a custom account id to the salesforce account", () => {
    const mappings = [
      { hull: "first_name",
        service: "FirstName",
        overwrite: false },
      { hull: "last_name",
        service: "LastName",
        overwrite: false },
      { hull: "email",
        service: "Email",
        overwrite: false },
      { hull: "traits_role",
        service: "Role__c",
        overwrite: true },
      { hull: "traits_intercom_contact/account_id",
        service: "AccountId",
        overwrite: true }
    ];

    const connectorSettings = {
      contact_attributes_outbound: mappings
    };
    const hObject = {
      id: "59fbcb5b641c10443804a528",
      created_at: "2017-11-03T01:50:19Z",
      email: "john_gi@exploremysticislands.com",
      domain: "exploremysticislands.com",
      name: "John Garibaldi",
      first_name: "John",
      last_name: "Garibaldi",
      role: "OWNER",
      "intercom_contact/account_id": "asdfasdf",
      "salesforce_contact/id": "0045800000TXlKNCA1",
      "salesforce_contact/account_id": "somesalesforceid"
    };

    const expectedSfObject = {
      Id: hObject["salesforce_contact/id"],
      AccountId: hObject["intercom_contact/account_id"],
      FirstName: hObject.first_name,
      LastName: hObject.last_name,
      Email: hObject.email,
      Role__c: hObject.role
    };

    const mapper = new AttributesMapper(connectorSettings);
    const sObject = mapper.mapToServiceObject("Contact", hObject, [], []);

    expect(sObject).toEqual(expectedSfObject);
  });

  it("should map a add account id even if not mapped to salesforce account", () => {
    const mappings = [
      { hull: "email",
        service: "Email",
        overwrite: false },
      { hull: "traits_role",
        service: "Role__c",
        overwrite: true }
    ];

    const connectorSettings = {
      contact_attributes_outbound: mappings
    };
    const hObject = {
      id: "59fbcb5b641c10443804a528",
      created_at: "2017-11-03T01:50:19Z",
      email: "john_gi@exploremysticislands.com",
      domain: "exploremysticislands.com",
      name: "John Garibaldi",
      first_name: "John",
      last_name: "Garibaldi",
      role: "OWNER",
      "intercom_contact/account_id": "asdfasdf",
      "salesforce_contact/id": "0045800000TXlKNCA1",
      "salesforce_contact/account_id": "somesalesforceid"
    };

    const expectedSfObject = {
      Id: hObject["salesforce_contact/id"],
      AccountId: hObject["salesforce_contact/account_id"],
      Email: hObject.email,
      Role__c: hObject.role
    };

    const mapper = new AttributesMapper(connectorSettings);
    const sObject = mapper.mapToServiceObject("Contact", hObject, [], []);

    expect(sObject).toEqual(expectedSfObject);
  });
});
