/* global Logger, SpreadsheetApp, PropertiesService, UrlFetchApp, HtmlService */
/* eslint-disable prefer-template, object-shorthand */

const MAX_COLUMNS = 1000;
const MAX_CHUNKS = 10000;
const IMPORT_CHUNK_SIZE = 100;

const urlFor = path => `https://hull-google-sheets.eu.ngrok.io/${path}`;

function addMenu() {
  const menu = SpreadsheetApp.getUi().createAddonMenu();
  menu.addItem("Open", "showSidebar");
  menu.addToUi();
}

function setUserProp({ key, index, value }) {
  PropertiesService.getUserProperties().setProperty(
    index ? `${index}-${key}` : key,
    JSON.stringify(value)
  );
  return value;
}
function clearProperties() {
  PropertiesService.getUserProperties().deleteAllProperties();
}
function getUserProp({ key, index, fallback }) {
  const val = PropertiesService.getUserProperties().getProperty(
    index ? `${index}-${key}` : key
  );
  try {
    return JSON.parse(val);
  } catch (err) {
    return fallback || val;
  }
}
function getSheetData({ index, startRow, rows }) {
  // index - 1 because https://developers.google.com/apps-script/reference/spreadsheet/sheet#getindex - spreadsheets are 1-indexed
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[index - 1];
  if (sheet) {
    return sheet.getRange(startRow, 1, rows, MAX_COLUMNS).getValues() || [];
  }
  return [];
}
function getColumnNames(index) {
  return (getSheetData({ index, startRow: 1, rows: 1 })[0] || []).filter(
    v => !!v
  );
}
function getSheetMapping(index, type) {
  const def = [
    {
      hull: null,
      service: null
    }
  ];
  return getUserProp({
    key: `${type}_mapping`,
    index,
    fallback: def
  });
}
function getSheetClaims(index, type) {
  const def = [
    {
      hull: null,
      service: null
    }
  ];
  return getUserProp({
    key: `${type}_claims`,
    index,
    fallback: def
  });
}

function api(method, path, data) {
  try {
    const token = getUserProp({ key: "token" });
    if (!token) {
      throw new Error("No Access Token available");
    }

    const options = {
      muteHttpExceptions: true,
      contentType: "application/json",
      method: method
    };

    if (method !== "get" && data) {
      options.payload = JSON.stringify(data);
    }

    const res = UrlFetchApp.fetch(urlFor(`${path}?token=${token}`), options);

    try {
      return {
        statusCode: res.getResponseCode(),
        body: JSON.parse(res.getContentText())
      };
    } catch (err) {
      return {
        statusCode: res.getResponseCode(),
        error: err
      };
    }
  } catch (err) {
    return {
      statusCode: 401,
      error: err.message
    };
  }
}

const getVal = val =>
  val != null && val.toString && val.toString().length > 0 ? val : undefined;

const rowToPayload = (mapping, claimsMapping, group) => row => ({
  attributes: mapping.reduce((attributes, { column, hull }) => {
    const value = getVal(row[column]);
    if (value !== undefined) {
      attributes[group ? `${group}/${hull}` : hull] = value;
    }
    return attributes;
  }, {}),
  claims: Object.keys(claimsMapping).reduce((claims, key) => {
    const column = claimsMapping[key];
    if (column !== undefined) {
      claims[key] = getVal(row[column]);
    }
    return claims;
  }, {})
});

const hasKeysAndValues = hash =>
  !!Object.keys(hash).length &&
  !!Object.values(hash).filter(v => v !== null).length;

const checkPayload = (memo, { claims, attributes }) => {
  if (!hasKeysAndValues(attributes) || !hasKeysAndValues(claims)) {
    memo.stats.skipped += 1;
  } else {
    memo.stats.imported += 1;
    memo.rows.push({ claims, attributes });
  }
  return memo;
};

const getRows = ({ index, startRow, chunkSize, mapping, claims, source }) =>
  getSheetData({
    index,
    startRow,
    rows: chunkSize
  })
    .map(rowToPayload(mapping, claims, source))
    .reduce(checkPayload, {
      rows: [],
      errors: [],
      stats: { skipped: 0, imported: 0, empty: 0, errors: 0 }
    });

function importPayloads({ payloads, type }) {
  const stats = {};
  const errors = [];
  if (payloads && payloads.rows && payloads.rows.length > 0) {
    try {
      api("post", "import", { payloads, type });
    } catch (err) {
      Logger.log("Error while importing", err);
      stats.errors += 1;
      errors.push(err.toString());
    }
    return { stats, errors };
  }
  return undefined;
}

function getHullAttributes({ type = "user", source = "" }) {
  const { statusCode, body, error } = api("post", "schema", { type, source });
  if (statusCode > 200) {
    throw new Error(
      `Error fetching attributes: ${error || (body && body.error)}`
    );
  }
  return body;
}

// IMPURE FUNCTION
const incrementStats = ({ stats, errors }, operations) => {
  Object.keys(stats).forEach(function mapKeys(key) {
    operations.forEach(function mapOperations(operation) {
      stats[key] += operation.stats[key] || 0;
      if (operation.errors && operation.errors.length) {
        operation.errors.forEach(errors.push);
      }
    });
  });
};

function importData({ index, type, source, mapping, claims }) {
  let startRow = 2;
  let chunk = 1;
  const stats = { imported: 0, empty: 0, errors: 0, skipped: 0 };
  const errors = [];

  while (startRow && chunk < MAX_CHUNKS) {
    const payloads = getRows({
      index,
      startRow,
      chunkSize: IMPORT_CHUNK_SIZE,
      mapping,
      claims,
      source
    });
    const importResponse = importPayloads({
      payloads,
      type
    });
    if (!importResponse) break;
    chunk += 1;
    startRow += IMPORT_CHUNK_SIZE;
    errors.push(...importResponse.errors);
    incrementStats({ stats, errors }, [payloads, importResponse]);
    setUserProp({
      key: "importProgress",
      index,
      value: stats
    });
    setUserProp({
      key: "importErrors",
      index,
      value: errors
    });
  }

  setUserProp({
    key: "importProgress",
    index,
    value: {}
  });
  setUserProp({
    key: "importErrors",
    index,
    value: []
  });
  return stats;
}

const prefixAndStringify = ({ prefix = "", data }) =>
  Object.keys(data).reduce((memo, key) => {
    const value = data[key];
    memo[`${prefix}-${key}`] = JSON.stringify(value);
    return memo;
  }, {});

function getActiveSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const index = sheet.getIndex();
  return {
    index,
    name: sheet.getName(),
    googleColumns: getColumnNames(index),
    importErrors:
      getUserProp({
        key: "importErrors",
        index,
        fallback: []
      }) || [],
    importProgress:
      getUserProp({
        key: "importProgress",
        index,
        fallback: {}
      }) || {}
  };
}

function showSidebar() {
  const sidebar = HtmlService.createTemplateFromFile("Sidebar").evaluate();
  sidebar.setTitle("Hull");
  SpreadsheetApp.getUi().showSidebar(sidebar);
}

function clearAll() {
  PropertiesService.getUserProperties().deleteAllProperties();
}

const onInstall = addMenu;

const onOpen = addMenu;

function bootstrap(index) {
  if (!index) {
    return {
      error: "No active Sheet"
    };
  }
  const source =
    getUserProp({
      key: "source",
      index,
      fallback: ""
    }) || "";
  const type =
    getUserProp({
      key: "type",
      index,
      fallback: "user"
    }) || "user";
  const token = getUserProp({ key: "token" });
  return token
    ? {
        token,
        googleColumns: getColumnNames(index),
        hullAttributes: getHullAttributes({ type, source }),
        user_mapping: getSheetMapping(index, "user"),
        user_claims: getSheetClaims(index, "user"),
        account_mapping: getSheetMapping(index, "account"),
        account_claims: getSheetClaims(index, "account"),
        user_event_mapping: getSheetMapping(index, "user_event"),
        user_event_claims: getSheetClaims(index, "user_event"),
        index,
        source,
        type
      }
    : {
        token: undefined,
        initialized: false
      };
}

function setUserProps({ index, data }) {
  Logger.log("SetUserProps", prefixAndStringify({ prefix: index, data }));
  try {
    PropertiesService.getUserProperties().setProperties(
      prefixAndStringify({ prefix: index, data })
    );
    return bootstrap(index);
  } catch (err) {
    Logger.log("error in setUserProps", err);
  }
}
