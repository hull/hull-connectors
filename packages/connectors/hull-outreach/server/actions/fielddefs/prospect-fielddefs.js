/* @flow */
import type { OutreachFieldDefinition } from "../../lib/types";

const PROSPECT_FIELDDEFS: Array<OutreachFieldDefinition> = [
  {
    id: "addedAt",
    label: "Added At",
    in: true,
    out: true,
    type: "datetime"
  },
  {
    id: "addressStreet",
    label: "Address Street",
    in: true,
    out: true
  },
  {
    id: "addressStreet2",
    label: "Address Street2",
    in: true,
    out: true
  },
  {
    id: "addressCity",
    label: "Address City",
    in: true,
    out: true
  },
  {
    id: "addressState",
    label: "Address State",
    in: true,
    out: true
  },
  {
    id: "addressZip",
    label: "Address Zip",
    in: true,
    out: true
  },
  {
    id: "addressCountry",
    label: "Address Country",
    in: true,
    out: true
  },
  {
    id: "angelListUrl",
    label: "AngelList Url",
    in: true,
    out: true
  },
  {
    id: "availableAt",
    label: "Available At",
    in: true,
    out: true,
    type: "datetime"
  },
  {
    id: "callsOptedOutAt",
    label: "Calls OptedOut At",
    in: true,
    out: false,
    type: "datetime"
  },
  {
    id: "campaignName",
    label: "Campaign Name",
    in: true,
    out: true
  },
  {
    id: "clickCount",
    label: "Click Count",
    in: true,
    out: false,
    type: "number"
  },
  {
    id: "createdAt",
    label: "Created At",
    in: true,
    out: false,
    type: "datetime"
  },
  {
    id: "custom1",
    label: "Custom1",
    in: true,
    out: true
  },
  {
    id: "custom2",
    label: "Custom2",
    in: true,
    out: true
  },
  {
    id: "custom3",
    label: "Custom3",
    in: true,
    out: true
  },
  {
    id: "custom4",
    label: "Custom4",
    in: true,
    out: true
  },
  {
    id: "custom5",
    label: "Custom5",
    in: true,
    out: true
  },
  {
    id: "custom6",
    label: "Custom6",
    in: true,
    out: true
  },
  {
    id: "custom7",
    label: "Custom7",
    in: true,
    out: true
  },
  {
    id: "custom8",
    label: "Custom8",
    in: true,
    out: true
  },
  {
    id: "custom9",
    label: "Custom9",
    in: true,
    out: true
  },
  {
    id: "custom10",
    label: "Custom10",
    in: true,
    out: true
  },
  {
    id: "custom11",
    label: "Custom11",
    in: true,
    out: true
  },
  {
    id: "custom12",
    label: "Custom12",
    in: true,
    out: true
  },
  {
    id: "custom13",
    label: "Custom13",
    in: true,
    out: true
  },
  {
    id: "custom14",
    label: "Custom14",
    in: true,
    out: true
  },
  {
    id: "custom15",
    label: "Custom15",
    in: true,
    out: true
  },
  {
    id: "custom16",
    label: "Custom16",
    in: true,
    out: true
  },
  {
    id: "custom17",
    label: "Custom17",
    in: true,
    out: true
  },
  {
    id: "custom18",
    label: "Custom18",
    in: true,
    out: true
  },
  {
    id: "custom19",
    label: "Custom19",
    in: true,
    out: true
  },
  {
    id: "custom20",
    label: "Custom20",
    in: true,
    out: true
  },
  {
    id: "custom21",
    label: "Custom21",
    in: true,
    out: true
  },
  {
    id: "custom22",
    label: "Custom22",
    in: true,
    out: true
  },
  {
    id: "custom23",
    label: "Custom23",
    in: true,
    out: true
  },
  {
    id: "custom24",
    label: "Custom24",
    in: true,
    out: true
  },
  {
    id: "custom25",
    label: "Custom25",
    in: true,
    out: true
  },
  {
    id: "custom26",
    label: "Custom26",
    in: true,
    out: true
  },
  {
    id: "custom27",
    label: "Custom27",
    in: true,
    out: true
  },
  {
    id: "custom28",
    label: "Custom28",
    in: true,
    out: true
  },
  {
    id: "custom29",
    label: "Custom29",
    in: true,
    out: true
  },
  {
    id: "custom30",
    label: "Custom30",
    in: true,
    out: true
  },
  {
    id: "custom31",
    label: "Custom31",
    in: true,
    out: true
  },
  {
    id: "custom32",
    label: "Custom32",
    in: true,
    out: true
  },
  {
    id: "custom33",
    label: "Custom33",
    in: true,
    out: true
  },
  {
    id: "custom34",
    label: "Custom34",
    in: true,
    out: true
  },
  {
    id: "custom35",
    label: "Custom35",
    in: true,
    out: true
  },
  {
    id: "dateOfBirth",
    label: "Date Of Birth",
    in: true,
    out: true,
    type: "date"
  },
  {
    id: "degree",
    label: "Degree",
    in: true,
    out: true
  },
  {
    id: "emails",
    label: "Emails",
    in: true,
    out: true,
    type: "array"
  },
  {
    id: "emailsOptedOutAt",
    label: "Emails Opted Out At",
    in: true,
    out: false,
    type: "datetime"
  },
  {
    id: "engagedAt",
    label: "Engaged At",
    in: true,
    out: false,
    type: "datetime"
  },
  {
    id: "engagedScore",
    label: "Engaged Score",
    in: true,
    out: false,
    type: "number"
  },
  {
    id: "eventName",
    label: "Event Name",
    in: true,
    out: true
  },
  {
    id: "externalId",
    label: "External Id",
    in: true,
    out: true
  },
  {
    id: "externalOwner",
    label: "External Owner",
    in: true,
    out: true
  },
  {
    id: "externalSource",
    label: "External Source",
    in: true,
    out: false
  },
  {
    id: "facebookUrl",
    label: "Facebook Url",
    in: true,
    out: true
  },
  {
    id: "firstName",
    label: "First Name",
    in: true,
    out: true
  },
  {
    id: "gender",
    label: "Gender",
    in: true,
    out: true
  },
  {
    id: "githubUrl",
    label: "Github Url",
    in: true,
    out: true
  },
  {
    id: "githubUsername",
    label: "Github Username",
    in: true,
    out: true
  },
  {
    id: "googlePlusUrl",
    label: "GooglePlus Url",
    in: true,
    out: true
  },
  {
    id: "graduationDate",
    label: "Graduation Date",
    in: true,
    out: true
  },
  {
    id: "homePhones",
    label: "Home Phones",
    in: true,
    out: true,
    type: "array"
  },
  {
    id: "jobStartDate",
    label: "Job Start Date",
    in: true,
    out: true
  },
  {
    id: "lastName",
    label: "Last Name",
    in: true,
    out: true
  },
  {
    id: "linkedInConnections",
    label: "LinkedIn Connections",
    in: true,
    out: true,
    type: "number"
  },
  {
    id: "linkedInId",
    label: "LinkedIn Id",
    in: true,
    out: true
  },
  {
    id: "linkedInSlug",
    label: "LinkedIn Slug",
    in: true,
    out: false
  },
  {
    id: "linkedInUrl",
    label: "LinkedIn Url",
    in: true,
    out: true
  },
  {
    id: "middleName",
    label: "Middle Name",
    in: true,
    out: true
  },
  {
    id: "mobilePhones",
    label: "Mobile Phones",
    in: true,
    out: true,
    type: "array"
  },
  {
    id: "name",
    label: "Name",
    in: true,
    out: false
  },
  {
    id: "nickname",
    label: "Nickname",
    in: true,
    out: true
  },
  {
    id: "occupation",
    label: "Occupation",
    in: true,
    out: true
  },
  {
    id: "openCount",
    label: "Open Count",
    in: true,
    out: false,
    type: "number"
  },
  {
    id: "optedOut",
    label: "Opted Out",
    in: true,
    out: true,
    type: "boolean"
  },
  {
    id: "optedOutAt",
    label: "Opted Out At",
    in: true,
    out: false
  },
  {
    id: "otherPhones",
    label: "Other Phones",
    in: true,
    out: true,
    type: "array"
  },
  {
    id: "personalNote1",
    label: "Personal Note1",
    in: true,
    out: true
  },
  {
    id: "personalNote2",
    label: "Personal Note2",
    in: true,
    out: true
  },
  {
    id: "preferredContact",
    label: "Preferred Contact",
    in: true,
    out: true
  },
  {
    id: "quoraUrl",
    label: "Quora Url",
    in: true,
    out: true
  },
  {
    id: "region",
    label: "Region",
    in: true,
    out: true
  },
  {
    id: "replyCount",
    label: "Reply Count",
    in: true,
    out: false,
    type: "number"
  },
  {
    id: "school",
    label: "School",
    in: true,
    out: true
  },
  {
    id: "score",
    label: "Score",
    in: true,
    out: true,
    type: "number"
  },
  {
    id: "smsOptedOutAt",
    label: "SmsOuptedOutAt",
    in: true,
    out: false,
    type: "datetime"
  },
  {
    id: "source",
    label: "Source",
    in: true,
    out: true
  },
  {
    id: "specialties",
    label: "Specialties",
    in: true,
    out: true
  },
  {
    id: "stackOverflowId",
    label: "StackOverflowId",
    in: true,
    out: true
  },
  {
    id: "stackOverflowUrl",
    label: "StackOverflowUrl",
    in: true,
    out: true
  },
  {
    id: "tags",
    label: "Tags",
    in: true,
    out: true,
    type: "array"
  },
  {
    id: "timeZone",
    label: "TimeZone",
    in: true,
    out: true
  },
  {
    id: "timeZoneIana",
    label: "TimeZone Iana",
    in: true,
    out: false
  },
  {
    id: "timeZoneInferred",
    label: "TimeZone Inferred",
    in: true,
    out: false
  },
  {
    id: "title",
    label: "Title",
    in: true,
    out: true
  },
  {
    id: "touchedAt",
    label: "Touched At",
    in: true,
    out: false,
    type: "datetime"
  },
  {
    id: "twitterUrl",
    label: "Twitter Url",
    in: true,
    out: true
  },
  {
    id: "twitterUsername",
    label: "Twitter Username",
    in: true,
    out: true
  },
  {
    id: "updatedAt",
    label: "Updated At",
    in: true,
    out: false,
    type: "datetime"
  },
  {
    id: "voipPhones",
    label: "Voip Phones",
    in: true,
    out: true,
    type: "array"
  },
  {
    id: "websiteUrl1",
    label: "Website Url1",
    in: true,
    out: true
  },
  {
    id: "websiteUrl2",
    label: "Website Url2",
    in: true,
    out: true
  },
  {
    id: "websiteUrl3",
    label: "Website Url3",
    in: true,
    out: true
  },
  {
    id: "workPhones",
    label: "Work Phones",
    in: true,
    out: true,
    type: "array"
  }
];

module.exports = PROSPECT_FIELDDEFS;
