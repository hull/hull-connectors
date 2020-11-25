/* global describe, test, expect */

const PatchUtil = require("../../server/lib/sync-agent/patch-util");
const { AttributesMapper } = require("../../server/lib/sync-agent/attributes-mapper");
const _ = require("lodash");
const expect = require("expect");

describe("PatchUtil", () => {
  const CONNECTOR_SETTINGS = {
    lead_attributes_outbound: [
      { hull: "first_name", service: "FirstName", overwrite: true },
      { hull: "last_name", service: "LastName", overwrite: true },
      { hull: "email", service: "Email", overwrite: true },
      { hull: "account._sales_business_won", service: "business_won__c", overwrite: true },
      { hull: "traits_clearbit/industry", service: "Industry__c", overwrite: false },
      { hull: "traits_status", service: "Status", overwrite: true },
      { hull: "traits_intercom/citygroup", service: "City", overwrite: true },
      { hull: "traits_company", service: "Company", overwrite: false }
    ],
    account_attributes_outbound: [
      { hull: "account.domain",
        service: "Website",
        overwrite: false },
      { hull: "account.name",
        service: "Name",
        overwrite: false },
      { hull: "account.mrr",
        service: "MRR__c",
        overwrite: true },
      { hull: "account.employees",
        service: "NumberOfEmployees",
        overwrite: false }
    ]
  };

  it("should return the entire object if there is no object from salesforce [Insert Lead]", () => {
    const tObject = {
      FirstName: "Sven3",
      LastName: "SFDC",
      Company: "Hull Test SFDC GmbH & Co KG",
      Status: "Sales Qualified Lead"
    };

    const pObject = {
      FirstName: tObject.FirstName,
      LastName: tObject.LastName,
      Company: tObject.Company,
      Status: tObject.Status
    };

    const serviceSchema = {};

    const util = new PatchUtil(CONNECTOR_SETTINGS);

    const patchResult = util.createPatchObject("Lead", tObject, {}, serviceSchema);

    expect(patchResult.hasChanges).toBe(true);
    expect(patchResult.patchObject).toEqual(pObject);
  });

  it("should return only the properties that have changed or weren't set previously [Update Lead]", () => {
    const tObject = {
      Id: "0012F000007ydmWQAQ",
      FirstName: "Sven3",
      LastName: "SFDC Update",
      Company: "Hull Test SFDC GmbH & Co KG",
      Status: "Sales Qualified Lead"
    };

    const aObject = {
      Id: "0012F000007ydmWQAQ",
      LastName: "SFDC",
      Company: "Hull Test SFDC GmbH & Co KG",
    };

    const pObject = {
      Id: "0012F000007ydmWQAQ",
      FirstName: "Sven3",
      LastName: "SFDC Update",
      Status: "Sales Qualified Lead"
    };

    const serviceSchema = {};

    const util = new PatchUtil(CONNECTOR_SETTINGS);

    const patchResult = util.createPatchObject("Lead", tObject, aObject, serviceSchema);

    expect(patchResult.hasChanges).toBe(true);
    expect(patchResult.patchObject).toEqual(pObject);
  });

  it("should throw an error if the Ids are different [Update Lead]", () => {
    const tObject = {
      Id: "0012F000007ydmWQAQ",
      FirstName: "Sven3",
      LastName: "SFDC Update",
      Company: "Hull Test SFDC GmbH & Co KG",
      Status: "Sales Qualified Lead"
    };

    const aObject = {
      Id: "makeitfail",
      LastName: "SFDC",
      Company: "Hull Test SFDC GmbH & Co KG",
    };
    const serviceSchema = {};

    const util = new PatchUtil(CONNECTOR_SETTINGS);

    try {
      util.createPatchObject("Lead", tObject, aObject, serviceSchema);
      expect(false).toBe(true);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("should detect date changes", () => {
    const privateSettings = {
      contact_attributes_outbound: [{ hull: "first_name",
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
        overwrite: true }]
    };

    const tObject = {
      AccountId: "0037900000WuEMrCAN",
      Active_Contacts__c: 284,
      CS_Active_Users__c: "19",
      Convo_alert__c: true,
      Datanyze_Revenue__c: "$1 - 10M",
      Email: "john_gi@exploremysticislands.com",
      FirstName: "John",
      Id: "0045800000TXlKNCA1",
      Integrations_Enabled__c: "clearbit_enrichment,googleAnalytics,hubspot",
      LastName: "Garibaldi",
      Last_Message__c: "2018-03-11T13:00:00Z",
      Last_Month_Conversations__c: 9954,
      Last_Month_Convo_Growth__c: 49.326904296875,
      Last_Valid_URL__c: "https://exploremysticislands.com/destinations",
      Last_Week_Conversations__c: 13954,
      Last_Week_Convo_Growth__c: 6.52142763137817,
      Last_visited_pricing_page__c: "2018-02-15T00:00:00.000Z",
      Last_visited_upgrade_page__c: "2018-01-14T00:00:00.000Z",
      Number_of_Playbooks_Active__c: 1,
      Number_of_visits_to_pricing_page__c: 13,
      Number_of_visits_to_upgrade_page__c: 51,
      Role__c: "OWNER",
      Tech_Spend__c: "$5K - 20K",
      Users__c: 3,
      Yesterday_Conversations__c: 14864,
      Yesterday_Convo_Growth__c: 0,
      chats__c: 15051,
      integrations__c: 1,
      last_seen__c: "2018-03-08T00:00:00.000Z"
    };

    const aObject = {
      FirstName: "John",
      LastName: "Garibaldi",
      Email: "john_gi@exploremysticislands.com",
      Role__c: "Owner",
      Last_Valid_URL__c: "https://exploremysticislands.com/destinations",
      Users__c: 3,
      Last_Message__c: "2018-03-11",
      Yesterday_Conversations__c: 14864,
      Active_Contacts__c: 284,
      chats__c: 15051,
      Last_Week_Conversations__c: 13954,
      Last_Week_Convo_Growth__c: 6.52142763137817,
      Last_Month_Conversations__c: 9954,
      Last_Month_Convo_Growth__c: 49.326904296875,
      Yesterday_Convo_Growth__c: 0,
      integrations__c: 1,
      Last_visited_upgrade_page__c: "2018-01-14",
      Number_of_visits_to_upgrade_page__c: 51,
      Last_visited_pricing_page__c: "2018-02-15",
      Number_of_visits_to_pricing_page__c: 13,
      last_seen__c: "2018-03-08T00:00:00.000+0000",
      Convo_alert__c: true,
      LeadSource: "Growth",
      Lead_Detail__c: "Anonymous Homepage Visit",
      Source_Timestamp__c: "2018-01-16T05:00:00.000+0000",
      Latest_Lead_Source__c: null,
      Latest_Lead_Detail__c: null,
      Latest_Source_Timestamp__c: null,
      Tech_Spend__c: "$5K - 20K",
      Datanyze_Revenue__c: "$1 - 10M",
      Datanyze_Money_Raised__c: null,
      CS_Active_Users__c: 19,
      Number_of_Playbooks_Active__c: 1,
      Integrations_Enabled__c: "clearbit_enrichment,googleAnalytics,hubspot"
    };

    const pObject = {
      AccountId: "0037900000WuEMrCAN",
      Last_visited_upgrade_page__c: "2018-01-14T00:00:00.000Z",
      Last_visited_pricing_page__c: "2018-02-15T00:00:00.000Z",
      last_seen__c: "2018-03-08T00:00:00.000Z",
      CS_Active_Users__c: "19"
    };

    const util = new PatchUtil(privateSettings);
    const serviceSchema = {};

    const patchResult = util.createPatchObject("Contact", tObject, aObject, serviceSchema);

    expect(patchResult.hasChanges).toBe(true);
    expect(patchResult.patchObject).toEqual(pObject);
  });

  it("should return changed properties. Hull array length === sf multi pick list length ", () => {
    const private_settings = {
      lead_attributes_outbound: [],
      contact_attributes_outbound: [
        {
          hull: "first_name",
          service: "FirstName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "last_name",
          service: "LastName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "email",
          service: "Email",
          overwrite: true
        },
        {
          hull: "traits_user_segments",
          service: "UserSegs__c",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/mobile_phone",
          service: "MobilePhone",
          overwrite: true
        }
      ],
      account_attributes_outbound: [],
      lead_attributes_inbound: [],
      account_attributes_inbound: [],
      account_claims: [],
    };

    const hullUser = {
      user_segments: [
        "seg3",
        "seg1"
      ],
      "salesforce_contact/first_name": "Al",
      "salesforce_contact/owner_id": "0054P0owQAG",
      "salesforce_contact/email": "al@alincorporated.com",
      id: "5ceff00e04e",
      email: "al@alincorporated.com",
      "salesforce_contact/last_name": "Albertson",
      last_known_ip: "216.239.38.21",
      name: "Al Albertson",
      "salesforce_contact/mobile_phone": "1234",
      anonymous_ids: [
        "salesforce-contact:0034QAH"
      ],
      domain: "alincorporated.com",
      last_name: "Albertson",
      indexed_at: "2019-07-09T16:46:06+00:00",
      "salesforce_contact/id": "0034QAH",
      first_name: "Al",
      created_at: "2019-05-30T15:22:50Z",
      is_approved: false,
      last_seen_at: "2019-07-09T12:43:40Z",
      segment_ids: [
        "5ccc40117dd61d9b680099e0"
      ],
      account: {},
      "salesforce_contact/account_id": "0014bQAO"
    };

    const actualSFContact = {
      attributes: {
        type: "Contact",
        url: "/services/data/v39.0/sobjects/Contact/0034P00002TCZlvQAH"
      },
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      UserSegs__c: "seg2;seg1",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedHullToSfContact = {
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      UserSegs__c: "seg1;seg3",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedPatchObject = {
      UserSegs__c: "seg1;seg3",
      Id: "0034QAH"
    };

    const serviceSchema = {
      UserSegs__c: "picklist"
    };

    const mapper = new AttributesMapper(private_settings);
    const hullToSfContact = mapper.mapToServiceObject("Contact", hullUser, [], []);

    expect(hullToSfContact).toEqual(expectedHullToSfContact);

    const patchUtil = new PatchUtil(private_settings);
    const patch = patchUtil.createPatchObject("Contact", hullToSfContact, actualSFContact, serviceSchema);

    expect(patch.patchObject).toEqual(expectedPatchObject);
    expect(patch.hasChanges).toEqual(true);
  });

  it("no changes. Hull array length === sf multi pick list length ", () => {
    const private_settings = {
      lead_attributes_outbound: [],
      contact_attributes_outbound: [
        {
          hull: "first_name",
          service: "FirstName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "last_name",
          service: "LastName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "email",
          service: "Email",
          overwrite: true
        },
        {
          hull: "traits_user_segments",
          service: "UserSegs__c",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/mobile_phone",
          service: "MobilePhone",
          overwrite: true
        }
      ],
      account_attributes_outbound: [],
      lead_attributes_inbound: [],
      account_attributes_inbound: [],
      account_claims: [],
    };

    const hullUser = {
      user_segments: [
        "seg2",
        "seg1"
      ],
      "salesforce_contact/first_name": "Al",
      "salesforce_contact/owner_id": "0054P0owQAG",
      "salesforce_contact/email": "al@alincorporated.com",
      id: "5ceff00e04e",
      email: "al@alincorporated.com",
      "salesforce_contact/last_name": "Albertson",
      last_known_ip: "216.239.38.21",
      name: "Al Albertson",
      "salesforce_contact/mobile_phone": "1234",
      anonymous_ids: [
        "salesforce-contact:0034QAH"
      ],
      domain: "alincorporated.com",
      last_name: "Albertson",
      indexed_at: "2019-07-09T16:46:06+00:00",
      "salesforce_contact/id": "0034QAH",
      first_name: "Al",
      created_at: "2019-05-30T15:22:50Z",
      is_approved: false,
      last_seen_at: "2019-07-09T12:43:40Z",
      segment_ids: [
        "5ccc40117dd61d9b680099e0"
      ],
      account: {},
      "salesforce_contact/account_id": "0014bQAO"
    };

    const actualSFContact = {
      attributes: {
        type: "Contact",
        url: "/services/data/v39.0/sobjects/Contact/0034P00002TCZlvQAH"
      },
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      UserSegs__c: "seg2;seg1",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedHullToSfContact = {
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      UserSegs__c: "seg1;seg2",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const serviceSchema = {
      UserSegs__c: "picklist"
    };

    const expectedPatchObject = {};

    const mapper = new AttributesMapper(private_settings);
    const hullToSfContact = mapper.mapToServiceObject("Contact", hullUser, [], []);

    expect(hullToSfContact).toEqual(expectedHullToSfContact);

    const patchUtil = new PatchUtil(private_settings);
    const patch = patchUtil.createPatchObject("Contact", hullToSfContact, actualSFContact, serviceSchema);

    expect(patch.patchObject).toEqual(expectedPatchObject);
    expect(patch.hasChanges).toEqual(false);
  });

  it("should return changed properties. Hull array length < sf multi pick list length ", () => {
    const private_settings = {
      lead_attributes_outbound: [],
      contact_attributes_outbound: [
        {
          hull: "first_name",
          service: "FirstName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "last_name",
          service: "LastName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "email",
          service: "Email",
          overwrite: true
        },
        {
          hull: "traits_user_segments",
          service: "UserSegs__c",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/mobile_phone",
          service: "MobilePhone",
          overwrite: true
        }
      ],
      account_attributes_outbound: [],
      lead_attributes_inbound: [],
      account_attributes_inbound: [],
      account_claims: [],
    };

    const hullUser = {
      user_segments: [
        "seg1"
      ],
      "salesforce_contact/first_name": "Al",
      "salesforce_contact/owner_id": "0054P0owQAG",
      "salesforce_contact/email": "al@alincorporated.com",
      id: "5ceff00e04e",
      email: "al@alincorporated.com",
      "salesforce_contact/last_name": "Albertson",
      last_known_ip: "216.239.38.21",
      name: "Al Albertson",
      "salesforce_contact/mobile_phone": "1234",
      anonymous_ids: [
        "salesforce-contact:0034QAH"
      ],
      domain: "alincorporated.com",
      last_name: "Albertson",
      indexed_at: "2019-07-09T16:46:06+00:00",
      "salesforce_contact/id": "0034QAH",
      first_name: "Al",
      created_at: "2019-05-30T15:22:50Z",
      is_approved: false,
      last_seen_at: "2019-07-09T12:43:40Z",
      segment_ids: [
        "5ccc40117dd61d9b680099e0"
      ],
      account: {},
      "salesforce_contact/account_id": "0014bQAO"
    };

    const actualSFContact = {
      attributes: {
        type: "Contact",
        url: "/services/data/v39.0/sobjects/Contact/0034P00002TCZlvQAH"
      },
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      UserSegs__c: "seg2;seg1;seg3",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedHullToSfContact = {
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      UserSegs__c: "seg1",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedPatchObject = {
      UserSegs__c: "seg1",
      Id: "0034QAH"
    };

    const serviceSchema = {
      UserSegs__c: "picklist"
    };

    const mapper = new AttributesMapper(private_settings);
    const hullToSfContact = mapper.mapToServiceObject("Contact", hullUser, [], []);
    expect(hullToSfContact).toEqual(expectedHullToSfContact);

    const patchUtil = new PatchUtil(private_settings);
    const patch = patchUtil.createPatchObject("Contact", hullToSfContact, actualSFContact, serviceSchema);

    expect(patch.patchObject).toEqual(expectedPatchObject);
    expect(patch.hasChanges).toEqual(true);
  });

  it("should return changed properties. Hull array length > sf multi pick list length ", () => {
    const private_settings = {
      lead_attributes_outbound: [],
      contact_attributes_outbound: [
        {
          hull: "first_name",
          service: "FirstName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "last_name",
          service: "LastName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "email",
          service: "Email",
          overwrite: true
        },
        {
          hull: "traits_user_segments",
          service: "UserSegs__c",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/mobile_phone",
          service: "MobilePhone",
          overwrite: true
        }
      ],
      account_attributes_outbound: [],
      lead_attributes_inbound: [],
      account_attributes_inbound: [],
      account_claims: [],
      lead_outgoing_user_segments: "LeadSegmentsField",
      lead_outgoing_account_segments: "LeadAccountSegmentsField",
      contact_outgoing_user_segments: "ContactSegmentsField",
      contact_outgoing_account_segments: "ContactAccountSegmentsField",
      account_outgoing_account_segments: "AccountSegmentsField",
    };

    const hullUser = {
      user_segments: [
        "seg2",
        "seg4",
        "seg1",
        "seg3"
      ],
      "salesforce_contact/first_name": "Al",
      "salesforce_contact/owner_id": "0054P0owQAG",
      "salesforce_contact/email": "al@alincorporated.com",
      id: "5ceff00e04e",
      email: "al@alincorporated.com",
      "salesforce_contact/last_name": "Albertson",
      last_known_ip: "216.239.38.21",
      name: "Al Albertson",
      "salesforce_contact/mobile_phone": "1234",
      anonymous_ids: [
        "salesforce-contact:0034QAH"
      ],
      domain: "alincorporated.com",
      last_name: "Albertson",
      indexed_at: "2019-07-09T16:46:06+00:00",
      "salesforce_contact/id": "0034QAH",
      first_name: "Al",
      created_at: "2019-05-30T15:22:50Z",
      is_approved: false,
      last_seen_at: "2019-07-09T12:43:40Z",
      segment_ids: [
        "5ccc40117dd61d9b680099e0"
      ],
      account: {},
      "salesforce_contact/account_id": "0014bQAO"
    };

    const segments = [
      {
        id: "1",
        name: "segment1",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      },
      {
        id: "2",
        name: "segment2",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      }
    ];

    const accountSegments = [
      {
        id: "a1",
        name: "accountSegment1",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      }
    ];


    const actualSFContact = {
      attributes: {
        type: "Contact",
        url: "/services/data/v39.0/sobjects/Contact/0034P00002TCZlvQAH"
      },
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      UserSegs__c: "seg2;seg1",
      ContactAccountSegmentsField: "accountSegment2;accountSegment3",
      ContactSegmentsField: "segment1",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedHullToSfContact = {
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      ContactAccountSegmentsField: "accountSegment1",
      ContactSegmentsField: "segment1;segment2",
      UserSegs__c: "seg1;seg2;seg3;seg4",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedPatchObject = {
      ContactAccountSegmentsField: "accountSegment1",
      ContactSegmentsField: "segment1;segment2",
      UserSegs__c: "seg1;seg2;seg3;seg4",
      Id: "0034QAH"
    };

    const serviceSchema = {
      UserSegs__c: "picklist"
    };

    const mapper = new AttributesMapper(private_settings);
    const hullToSfContact = mapper.mapToServiceObject("Contact", hullUser, segments, accountSegments);

    expect(hullToSfContact).toEqual(expectedHullToSfContact);

    const patchUtil = new PatchUtil(private_settings);
    const patch = patchUtil.createPatchObject("Contact", hullToSfContact, actualSFContact, serviceSchema);

    expect(patch.patchObject).toEqual(expectedPatchObject);
    expect(patch.hasChanges).toEqual(true);
  });

  it("should return changed properties. No sf array value defined ", () => {
    const private_settings = {
      lead_attributes_outbound: [],
      contact_attributes_outbound: [
        {
          hull: "first_name",
          service: "FirstName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "last_name",
          service: "LastName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "email",
          service: "Email",
          overwrite: true
        },
        {
          hull: "traits_user_segments",
          service: "UserSegs__c",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/mobile_phone",
          service: "MobilePhone",
          overwrite: true
        }
      ],
      account_attributes_outbound: [],
      lead_attributes_inbound: [],
      account_attributes_inbound: [],
      account_claims: []
    };

    const hullUser = {
      user_segments: [
        "seg1",
        "seg4",
        "seg3",
        "seg2"
      ],
      "salesforce_contact/first_name": "Al",
      "salesforce_contact/owner_id": "0054P0owQAG",
      "salesforce_contact/email": "al@alincorporated.com",
      id: "5ceff00e04e",
      email: "al@alincorporated.com",
      "salesforce_contact/last_name": "Albertson",
      last_known_ip: "216.239.38.21",
      name: "Al Albertson",
      "salesforce_contact/mobile_phone": "1234",
      anonymous_ids: [
        "salesforce-contact:0034QAH"
      ],
      domain: "alincorporated.com",
      last_name: "Albertson",
      indexed_at: "2019-07-09T16:46:06+00:00",
      "salesforce_contact/id": "0034QAH",
      first_name: "Al",
      created_at: "2019-05-30T15:22:50Z",
      is_approved: false,
      last_seen_at: "2019-07-09T12:43:40Z",
      segment_ids: [
        "5ccc40117dd61d9b680099e0"
      ],
      account: {},
      "salesforce_contact/account_id": "0014bQAO"
    };

    const actualSFContact = {
      attributes: {
        type: "Contact",
        url: "/services/data/v39.0/sobjects/Contact/0034P00002TCZlvQAH"
      },
      FirstName: "Al",
      LastName: "Albertson",
      UserSegs__c: null,
      Email: "al@alincorporated.com",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedHullToSfContact = {
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      UserSegs__c: "seg1;seg2;seg3;seg4",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedPatchObject = {
      UserSegs__c: "seg1;seg2;seg3;seg4",
      Id: "0034QAH"
    };

    const serviceSchema = {
      UserSegs__c: "picklist"
    };

    const mapper = new AttributesMapper(private_settings);

    const hullToSfContact = mapper.mapToServiceObject("Contact", hullUser, [], []);

    expect(hullToSfContact).toEqual(expectedHullToSfContact);

    const patchUtil = new PatchUtil(private_settings);
    const patch = patchUtil.createPatchObject("Contact", hullToSfContact, actualSFContact, serviceSchema);

    expect(patch.patchObject).toEqual(expectedPatchObject);
    expect(patch.hasChanges).toEqual(true);
  });

  it("should return changed properties. Single value in sf multi pick list", () => {
    const private_settings = {
      lead_attributes_outbound: [],
      contact_attributes_outbound: [
        {
          hull: "first_name",
          service: "FirstName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "last_name",
          service: "LastName",
          default_value: "[Unknown]",
          overwrite: true
        },
        {
          hull: "email",
          service: "Email",
          overwrite: true
        },
        {
          hull: "traits_user_segments",
          service: "UserSegs__c",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/mobile_phone",
          service: "MobilePhone",
          overwrite: true
        }
      ],
      account_attributes_outbound: [],
      lead_attributes_inbound: [],
      account_attributes_inbound: [],
      account_claims: [],
      contact_outgoing_user_segments: "ContactSegmentsField"
    };

    const hullUser = {
      user_segments: [
        "seg3",
        "seg1",
        "seg4",
        "seg2"
      ],
      "salesforce_contact/first_name": "Al",
      "salesforce_contact/owner_id": "0054P0owQAG",
      "salesforce_contact/email": "al@alincorporated.com",
      id: "5ceff00e04e",
      email: "al@alincorporated.com",
      "salesforce_contact/last_name": "Albertson",
      last_known_ip: "216.239.38.21",
      name: "Al Albertson",
      "salesforce_contact/mobile_phone": "1234",
      anonymous_ids: [
        "salesforce-contact:0034QAH"
      ],
      domain: "alincorporated.com",
      last_name: "Albertson",
      indexed_at: "2019-07-09T16:46:06+00:00",
      "salesforce_contact/id": "0034QAH",
      first_name: "Al",
      created_at: "2019-05-30T15:22:50Z",
      is_approved: false,
      last_seen_at: "2019-07-09T12:43:40Z",
      segment_ids: [
        "5ccc40117dd61d9b680099e0"
      ],
      account: {},
      "salesforce_contact/account_id": "0014bQAO"
    };

    const segments = [
      {
        id: "2",
        name: "segment2",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      },
      {
        id: "1",
        name: "segment1",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      },
      {
        id: "3",
        name: "segment3",
        type: "users_segment",
        created_at: "2017-10-25T14:12:23Z",
        updated_at: "2017-10-25T14:12:23Z"
      }
    ];


    const actualSFContact = {
      attributes: {
        type: "Contact",
        url: "/services/data/v39.0/sobjects/Contact/0034P00002TCZlvQAH"
      },
      FirstName: "Al",
      LastName: "Albertson",
      UserSegs__c: "seg1",
      ContactSegmentsField: "segment1;segment2;segment3",
      Email: "al@alincorporated.com",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedHullToSfContact = {
      FirstName: "Al",
      LastName: "Albertson",
      Email: "al@alincorporated.com",
      ContactSegmentsField: "segment1;segment2;segment3",
      UserSegs__c: "seg1;seg2;seg3;seg4",
      MobilePhone: "1234",
      Id: "0034QAH",
      AccountId: "0014bQAO"
    };

    const expectedPatchObject = {
      UserSegs__c: "seg1;seg2;seg3;seg4",
      Id: "0034QAH"
    };

    const serviceSchema = {
      UserSegs__c: "picklist"
    };

    const mapper = new AttributesMapper(private_settings);
    const hullToSfContact = mapper.mapToServiceObject("Contact", hullUser, segments, []);
    expect(hullToSfContact).toEqual(expectedHullToSfContact);

    const patchUtil = new PatchUtil(private_settings);
    const patch = patchUtil.createPatchObject("Contact", hullToSfContact, actualSFContact, serviceSchema);

    expect(patch.patchObject).toEqual(expectedPatchObject);
    expect(patch.hasChanges).toEqual(true);
  });

  it("should return patch object with null attribute", () => {
    const private_settings = {
      send_null_values: true,
      contact_attributes_outbound: [
        {
          hull: "traits_salesforce_contact/random_attribute",
          service: "RandomAttribute",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/department",
          service: "Department",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/mobile_phone",
          service: "MobilePhone",
          overwrite: true
        },
        {
          hull: "traits_salesforce_contact/description",
          service: "Description",
          overwrite: true
        }
      ]
    };

    const hullUser = {
      "salesforce_contact/id": "1",
      "salesforce_contact/department": "Sales",
      email: "al@alincorporated.com"
    };

    const actualSFContact = {
      attributes: {
        type: "Contact",
        url: "/services/data/v39.0/sobjects/Contact/0034P00002TCZlvQAH"
      },
      Id: "1",
      Department: "Marketing",
      Email: "al@alincorporated.com",
      MobilePhone: "1234",
      Description: "Some description"
    };

    const expectedHullToSfContact = {
      Id: "1",
      Department: "Sales"
    };

    const expectedPatchObject = {
      Id: "1",
      Department: "Sales",
      fieldsToNull: ["MobilePhone", "Description"]
    };

    const schema = {};

    const mapper = new AttributesMapper(private_settings);
    const hullToSfContact = mapper.mapToServiceObject("Contact", hullUser);

    expect(hullToSfContact).toEqual(expectedHullToSfContact);

    const patchUtil = new PatchUtil(private_settings);
    const patch = patchUtil.createPatchObject("Contact", hullToSfContact, actualSFContact, schema);

    expect(patch.patchObject).toEqual(expectedPatchObject);
    expect(patch.hasChanges).toEqual(true);
  });
});
