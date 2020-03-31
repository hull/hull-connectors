/* @flow */

const accountFields = [
  {
    name: "companyType",
    display: "Company Type",
    readonly: false
  },
  {
    name: "createdAt",
    display: "Created At",
    readOnly: true
  },
  {
    name: "custom1",
    display: "Custom1",
    readOnly: false
  },
  {
    name: "custom2",
    display: "Custom2",
    readOnly: false
  },
  {
    name: "custom3",
    display: "Custom3",
    readOnly: false
  },
  {
    name: "custom4",
    display: "Custom4",
    readOnly: false
  },
  {
    name: "custom5",
    display: "Custom5",
    readOnly: false
  },
  {
    name: "custom6",
    display: "Custom6",
    readOnly: false
  },
  {
    name: "custom7",
    display: "Custom7",
    readOnly: false
  },
  {
    name: "custom8",
    display: "Custom8",
    readOnly: false
  },
  {
    name: "custom9",
    display: "Custom9",
    readOnly: false
  },
  {
    name: "custom10",
    display: "Custom10",
    readOnly: false
  },
  {
    name: "custom11",
    display: "Custom11",
    readOnly: false
  },
  {
    name: "custom12",
    display: "Custom12",
    readOnly: false
  },
  {
    name: "custom13",
    display: "Custom13",
    readOnly: false
  },
  {
    name: "custom14",
    display: "Custom14",
    readOnly: false
  },
  {
    name: "custom15",
    display: "Custom15",
    readOnly: false
  },
  {
    name: "custom16",
    display: "Custom16",
    readOnly: false
  },
  {
    name: "custom17",
    display: "Custom17",
    readOnly: false
  },
  {
    name: "custom18",
    display: "Custom18",
    readOnly: false
  },
  {
    name: "custom19",
    display: "Custom19",
    readOnly: false
  },
  {
    name: "custom20",
    display: "Custom20",
    readOnly: false
  },
  {
    name: "custom21",
    display: "Custom21",
    readOnly: false
  },
  {
    name: "custom22",
    display: "Custom22",
    readOnly: false
  },
  {
    name: "custom23",
    display: "Custom23",
    readOnly: false
  },
  {
    name: "custom24",
    display: "Custom24",
    readOnly: false
  },
  {
    name: "custom25",
    display: "Custom25",
    readOnly: false
  },
  {
    name: "custom26",
    display: "Custom26",
    readOnly: false
  },
  {
    name: "custom27",
    display: "Custom27",
    readOnly: false
  },
  {
    name: "custom28",
    display: "Custom28",
    readOnly: false
  },
  {
    name: "custom29",
    display: "Custom29",
    readOnly: false
  },
  {
    name: "custom30",
    display: "Custom30",
    readOnly: false
  },
  {
    name: "custom31",
    display: "Custom31",
    readOnly: false
  },
  {
    name: "custom32",
    display: "Custom32",
    readOnly: false
  },
  {
    name: "custom33",
    display: "Custom33",
    readOnly: false
  },
  {
    name: "custom34",
    display: "Custom34",
    readOnly: false
  },
  {
    name: "custom35",
    display: "Custom35",
    readOnly: false
  },
  {
    name: "customId",
    display: "CustomId",
    readOnly: false
  },
  {
    name: "description",
    display: "Description",
    readOnly: false
  },
  {
    name: "domain",
    display: "Domain",
    readOnly: false
  },
  {
    name: "externalSource",
    display: "ExternalSource",
    readOnly: true
  },
  {
    name: "followers",
    display: "Followers",
    readOnly: false
  },
  {
    name: "foundedAt",
    display: "Founded At",
    readOnly: false,
    type: "datetime"
  },

  {
    name: "industry",
    display: "Industry",
    readOnly: false
  },
  {
    name: "linkedInEmployees",
    display: "LinkedIn Employees",
    readOnly: false
  },
  {
    name: "linkedInUrl",
    display: "LinkedIn Url",
    readOnly: false
  },
  {
    name: "locality",
    display: "Locality",
    readOnly: false
  },
  {
    name: "name",
    display: "Name",
    readOnly: false
  },
  {
    name: "named",
    display: "Named",
    readOnly: false
  },
  {
    name: "naturalName",
    display: "Natural Name",
    readOnly: false
  },
  {
    name: "numberOfEmployees",
    display: "Number Of Employees",
    readOnly: false
  },
  {
    name: "owner",
    display: "Owner Id",
    readOnly: true
  },
  {
    name: "ownerEmail",
    display: "Owner Email",
    readOnly: true
  },
  {
    name: "tags",
    display: "Tags",
    readOnly: false
  },
  {
    name: "updatedAt",
    display: "Updated At",
    readOnly: false
  },
  {
    name: "websiteUrl",
    display: "Website Url",
    readOnly: false
  }
];

const prospectFields = [
  {
    name: "addedAt",
    display: "Added At",
    readOnly: false,
    type: "datetime"
  },
  {
    name: "addressStreet",
    display: "Address Street",
    readOnly: false
  },
  {
    name: "addressStreet2",
    display: "Address Street2",
    readOnly: false
  },
  {
    name: "addressCity",
    display: "Address City",
    readOnly: false
  },
  {
    name: "addressState",
    display: "Address State",
    readOnly: false
  },
  {
    name: "addressZip",
    display: "Address Zip",
    readOnly: false
  },
  {
    name: "addressCountry",
    display: "Address Country",
    readOnly: false
  },
  {
    name: "angelListUrl",
    display: "AngelList Url",
    readOnly: false
  },
  {
    name: "availableAt",
    display: "Available At",
    readOnly: false,
    type: "datetime"
  },
  {
    name: "callsOptedOutAt",
    display: "Calls OptedOut At",
    readOnly: true,
    type: "datetime"
  },
  {
    name: "campaignName",
    display: "Campaign Name",
    readOnly: false
  },
  {
    name: "clickCount",
    display: "Click Count",
    readOnly: true,
    type: "number"
  },
  {
    name: "createdAt",
    display: "Created At",
    readOnly: true,
    type: "datetime"
  },
  {
    name: "custom1",
    display: "Custom1",
    readOnly: false
  },
  {
    name: "custom2",
    display: "Custom2",
    readOnly: false
  },
  {
    name: "custom3",
    display: "Custom3",
    readOnly: false
  },
  {
    name: "custom4",
    display: "Custom4",
    readOnly: false
  },
  {
    name: "custom5",
    display: "Custom5",
    readOnly: false
  },
  {
    name: "custom6",
    display: "Custom6",
    readOnly: false
  },
  {
    name: "custom7",
    display: "Custom7",
    readOnly: false
  },
  {
    name: "custom8",
    display: "Custom8",
    readOnly: false
  },
  {
    name: "custom9",
    display: "Custom9",
    readOnly: false
  },
  {
    name: "custom10",
    display: "Custom10",
    readOnly: false
  },
  {
    name: "custom11",
    display: "Custom11",
    readOnly: false
  },
  {
    name: "custom12",
    display: "Custom12",
    readOnly: false
  },
  {
    name: "custom13",
    display: "Custom13",
    readOnly: false
  },
  {
    name: "custom14",
    display: "Custom14",
    readOnly: false
  },
  {
    name: "custom15",
    display: "Custom15",
    readOnly: false
  },
  {
    name: "custom16",
    display: "Custom16",
    readOnly: false
  },
  {
    name: "custom17",
    display: "Custom17",
    readOnly: false
  },
  {
    name: "custom18",
    display: "Custom18",
    readOnly: false
  },
  {
    name: "custom19",
    display: "Custom19",
    readOnly: false
  },
  {
    name: "custom20",
    display: "Custom20",
    readOnly: false
  },
  {
    name: "custom21",
    display: "Custom21",
    readOnly: false
  },
  {
    name: "custom22",
    display: "Custom22",
    readOnly: false
  },
  {
    name: "custom23",
    display: "Custom23",
    readOnly: false
  },
  {
    name: "custom24",
    display: "Custom24",
    readOnly: false
  },
  {
    name: "custom25",
    display: "Custom25",
    readOnly: false
  },
  {
    name: "custom26",
    display: "Custom26",
    readOnly: false
  },
  {
    name: "custom27",
    display: "Custom27",
    readOnly: false
  },
  {
    name: "custom28",
    display: "Custom28",
    readOnly: false
  },
  {
    name: "custom29",
    display: "Custom29",
    readOnly: false
  },
  {
    name: "custom30",
    display: "Custom30",
    readOnly: false
  },
  {
    name: "custom31",
    display: "Custom31",
    readOnly: false
  },
  {
    name: "custom32",
    display: "Custom32",
    readOnly: false
  },
  {
    name: "custom33",
    display: "Custom33",
    readOnly: false
  },
  {
    name: "custom34",
    display: "Custom34",
    readOnly: false
  },
  {
    name: "custom35",
    display: "Custom35",
    readOnly: false
  },
  {
    name: "custom36",
    display: "Custom36",
    readOnly: false
  },
  {
    name: "custom37",
    display: "Custom37",
    readOnly: false
  },
  {
    name: "custom38",
    display: "Custom38",
    readOnly: false
  },
  {
    name: "custom39",
    display: "Custom39",
    readOnly: false
  },
  {
    name: "custom40",
    display: "Custom40",
    readOnly: false
  },
  {
    name: "custom41",
    display: "Custom41",
    readOnly: false
  },
  {
    name: "custom42",
    display: "Custom42",
    readOnly: false
  },
  {
    name: "custom43",
    display: "Custom43",
    readOnly: false
  },
  {
    name: "custom44",
    display: "Custom44",
    readOnly: false
  },
  {
    name: "custom45",
    display: "Custom45",
    readOnly: false
  },
  {
    name: "custom46",
    display: "Custom46",
    readOnly: false
  },
  {
    name: "custom47",
    display: "Custom47",
    readOnly: false
  },
  {
    name: "custom48",
    display: "Custom48",
    readOnly: false
  },
  {
    name: "custom49",
    display: "Custom49",
    readOnly: false
  },
  {
    name: "custom50",
    display: "Custom50",
    readOnly: false
  },
  {
    name: "custom51",
    display: "Custom51",
    readOnly: false
  },
  {
    name: "custom52",
    display: "Custom52",
    readOnly: false
  },
  {
    name: "custom53",
    display: "Custom53",
    readOnly: false
  },
  {
    name: "custom54",
    display: "Custom54",
    readOnly: false
  },
  {
    name: "custom55",
    display: "Custom55",
    readOnly: false
  },
  {
    name: "dateOfBirth",
    display: "Date Of Birth",
    readOnly: false,
    type: "date"
  },
  {
    name: "degree",
    display: "Degree",
    readOnly: false
  },
  {
    name: "emails",
    display: "Emails",
    readOnly: false,
    type: "array"
  },
  {
    name: "emailsOptedOutAt",
    display: "Emails Opted Out At",
    readOnly: true,
    type: "datetime"
  },
  {
    name: "engagedAt",
    display: "Engaged At",
    readOnly: true,
    type: "datetime"
  },
  {
    name: "engagedScore",
    display: "Engaged Score",
    readOnly: true,
    type: "number"
  },
  {
    name: "eventName",
    display: "Event Name",
    readOnly: false
  },
  {
    name: "externalId",
    display: "External Id",
    readOnly: false
  },
  {
    name: "externalOwner",
    display: "External Owner",
    readOnly: false
  },
  {
    name: "externalSource",
    display: "External Source",
    readOnly: true
  },
  {
    name: "facebookUrl",
    display: "Facebook Url",
    readOnly: false
  },
  {
    name: "firstName",
    display: "First Name",
    readOnly: false
  },
  {
    name: "gender",
    display: "Gender",
    readOnly: false
  },
  {
    name: "githubUrl",
    display: "Github Url",
    readOnly: false
  },
  {
    name: "githubUsername",
    display: "Github Username",
    readOnly: false
  },
  {
    name: "googlePlusUrl",
    display: "GooglePlus Url",
    readOnly: false
  },
  {
    name: "graduationDate",
    display: "Graduation Date",
    readOnly: false
  },
  {
    name: "homePhones",
    display: "Home Phones",
    readOnly: false,
    type: "array"
  },
  {
    name: "jobStartDate",
    display: "Job Start Date",
    readOnly: false
  },
  {
    name: "lastName",
    display: "Last Name",
    readOnly: false
  },
  {
    name: "linkedInConnections",
    display: "LinkedIn Connections",
    readOnly: false,
    type: "number"
  },
  {
    name: "linkedInId",
    display: "LinkedIn Id",
    readOnly: false
  },
  {
    name: "linkedInSlug",
    display: "LinkedIn Slug",
    readOnly: true
  },
  {
    name: "linkedInUrl",
    display: "LinkedIn Url",
    readOnly: false
  },
  {
    name: "mnamedleName",
    display: "Mnamedle Name",
    readOnly: false
  },
  {
    name: "mobilePhones",
    display: "Mobile Phones",
    readOnly: false,
    type: "array"
  },
  {
    name: "name",
    display: "Name",
    readOnly: true
  },
  {
    name: "nickname",
    display: "Nickname",
    readOnly: false
  },
  {
    name: "occupation",
    display: "Occupation",
    readOnly: false
  },
  {
    name: "openCount",
    display: "Open Count",
    readOnly: true,
    type: "number"
  },
  {
    name: "optedOut",
    display: "Opted Out",
    readOnly: false,
    type: "boolean"
  },
  {
    name: "optedOutAt",
    display: "Opted Out At",
    readOnly: true
  },
  {
    name: "otherPhones",
    display: "Other Phones",
    readOnly: false,
    type: "array"
  },
  {
    name: "owner",
    display: "Owner",
    readOnly: false
  },
  {
    name: "ownerEmail",
    display: "Owner Email",
    readOnly: true
  },
  {
    name: "personalNote1",
    display: "Personal Note1",
    readOnly: false
  },
  {
    name: "personalNote2",
    display: "Personal Note2",
    readOnly: false
  },
  {
    name: "preferredContact",
    display: "Preferred Contact",
    readOnly: false
  },
  {
    name: "quoraUrl",
    display: "Quora Url",
    readOnly: false
  },
  {
    name: "region",
    display: "Region",
    readOnly: false
  },
  {
    name: "replyCount",
    display: "Reply Count",
    readOnly: true,
    type: "number"
  },
  {
    name: "school",
    display: "School",
    readOnly: false
  },
  {
    name: "score",
    display: "Score",
    readOnly: false,
    type: "number"
  },
  {
    name: "smsOptedOutAt",
    display: "SmsOuptedOutAt",
    readOnly: true,
    type: "datetime"
  },
  {
    name: "source",
    display: "Source",
    readOnly: false
  },
  {
    name: "specialties",
    display: "Specialties",
    readOnly: false
  },
  {
    name: "stackOverflowId",
    display: "StackOverflowId",
    readOnly: false
  },
  {
    name: "stackOverflowUrl",
    display: "StackOverflowUrl",
    readOnly: false
  },
  {
    name: "stage",
    display: "Stage",
    readOnly: false
  },
  {
    name: "stageName",
    display: "Stage Name",
    readOnly: true
  },
  {
    name: "tags",
    display: "Tags",
    readOnly: false,
    type: "array"
  },
  {
    name: "timeZone",
    display: "TimeZone",
    readOnly: false
  },
  {
    name: "timeZoneIana",
    display: "TimeZone Iana",
    readOnly: true
  },
  {
    name: "timeZoneInferred",
    display: "TimeZone Inferred",
    readOnly: true
  },
  {
    name: "title",
    display: "Title",
    readOnly: false
  },
  {
    name: "touchedAt",
    display: "Touched At",
    readOnly: true,
    type: "datetime"
  },
  {
    name: "twitterUrl",
    display: "Twitter Url",
    readOnly: false
  },
  {
    name: "twitterUsername",
    display: "Twitter Username",
    readOnly: false
  },
  {
    name: "updatedAt",
    display: "Updated At",
    readOnly: true,
    type: "datetime"
  },
  {
    name: "voipPhones",
    display: "Voip Phones",
    readOnly: false,
    type: "array"
  },
  {
    name: "websiteUrl1",
    display: "Website Url1",
    readOnly: false
  },
  {
    name: "websiteUrl2",
    display: "Website Url2",
    readOnly: false
  },
  {
    name: "websiteUrl3",
    display: "Website Url3",
    readOnly: false
  },
  {
    name: "workPhones",
    display: "Work Phones",
    readOnly: false,
    type: "array"
  }
];

module.exports = {
  prospectFields,
  accountFields
};
