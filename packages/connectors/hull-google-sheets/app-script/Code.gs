/* global Logger, SpreadsheetApp, PropertiesService, UrlFetchApp, HtmlService */
/* eslint-disable prefer-template, object-shorthand */

const MAX_COLUMNS = 1000;
const MAX_CHUNKS = 10000;
const IMPORT_CHUNK_SIZE = 100;

const urlFor = path => `https://google-sheets.hullapp.com/${path}`;

function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu("Hull");
  menu.addItem("Open Importer", "showSidebar").addToUi();
}

const onInstall = function(e) {
  onOpen(e);
  showSidebar();
};

function setProp(store, { key, index, value }) {
  store.setProperty(index ? `${index}-${key}` : key, JSON.stringify(value));
  return value;
}
function setUserProp(prop) {
  return setProp(PropertiesService.getUserProperties(), prop);
}
function setDocumentProp(prop) {
  return setProp(PropertiesService.getDocumentProperties(), prop);
}
function saveToken(value) {
  return setProp(PropertiesService.getDocumentProperties(), {
    value,
    key: "token"
  });
}
function clearProperties() {
  PropertiesService.getUserProperties().deleteAllProperties();
  PropertiesService.getDocumentProperties().deleteAllProperties();
}

function getProp(store, { key, index, fallback }) {
  const val = store.getProperty(index ? `${index}-${key}` : key);
  try {
    return JSON.parse(val);
  } catch (err) {
    return fallback || val;
  }
}
function getUserProp(prop) {
  return getProp(PropertiesService.getUserProperties(), prop);
}
function getDocumentProp(prop) {
  return getProp(PropertiesService.getDocumentProperties(), prop);
}

function getSelectedRange() {
  const sheet = SpreadsheetApp.getActiveSheet();
  return sheet.getSelection().getActiveRange();
}

function getSheetData({ index, startRow, rows }) {
  // index - 1 because https://developers.google.com/apps-script/reference/spreadsheet/sheet#getindex - spreadsheets are 1-indexed
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[index - 1];
  if (sheet && rows > 0) {
    return (
      sheet.getRange(startRow, 1, rows, sheet.getLastColumn()).getValues() || []
    );
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
  return getDocumentProp({
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
  return getDocumentProp({
    key: `${type}_claims`,
    index,
    fallback: def
  });
}
function getSheetContext(index, type) {
  const def = {
    event_name: null,
    created_at: null,
    event_id: null,
    source: null,
    type: null
  };
  return getDocumentProp({
    key: `${type}_context`,
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

const getVal = val => {
  if (val === null || val === undefined) {
    return undefined;
  }
  if (!isNaN(val)) {
    return val;
  }
  if (val.toString && val.toString().length) {
    return val;
  }
  return undefined;
};

const hashToValues = (row, hash) =>
  Object.keys(hash).reduce((obj, key) => {
    const column = hash[key];
    if (column !== undefined && column !== null) {
      const value = getVal(row[column]);
      if (value !== "" && value !== undefined) {
        obj[key] = value;
      }
    }
    return obj;
  }, {});

const rowToPayload = (mapping, claimsMapping, contextMapping) => row => ({
  attributes: mapping.reduce((attributes, { column, hull }) => {
    const value = getVal(row[column]);
    if (value !== undefined) {
      attributes[hull] = value;
    }
    return attributes;
  }, {}),
  claims: hashToValues(row, claimsMapping),
  context: contextMapping ? hashToValues(row, contextMapping) : undefined
});

const hasKeysAndValues = hash =>
  !!Object.keys(hash).length &&
  !!Object.values(hash).filter(v => v !== undefined).length;

const hasValidEventContext = ({ event_name }) => event_name !== undefined;

const checkPayload = (memo, { claims, attributes, context }) => {
  if (
    !hasKeysAndValues(attributes) ||
    !hasKeysAndValues(claims) ||
    (context !== undefined && !hasValidEventContext(context))
  ) {
    memo.stats.skipped += 1;
  } else {
    memo.stats.imported += 1;
    memo.rows.push({ claims, attributes, context });
  }
  return memo;
};

const getRows = ({ index, startRow, rows, context, mapping, claims }) =>
  getSheetData({
    index,
    startRow,
    rows
  })
    .map(rowToPayload(mapping, claims, context))
    .reduce(checkPayload, {
      rows: [],
      errors: [],
      stats: { skipped: 0, imported: 0, empty: 0, errors: 0 }
    });

// IMPURE FUNCTION
function importPayloads({ payloads, type }) {
  const stats = {};
  const errors = [];
  if (payloads && payloads.rows && payloads.rows.length > 0) {
    try {
      api("post", "import", { payloads, type });
      Logger.log("IMPORT DONE", { type, payloads });
    } catch (err) {
      Logger.log("Error while importing", err);
      stats.errors += 1;
      errors.push(err.toString());
    }
    return { stats, errors };
  }
  return undefined;
}

const onlyUnique = (value, index, self) => self.indexOf(value) === index;

const getGroupsFromSchema = schema =>
  schema
    .filter(attribute => attribute.indexOf("/") > 0)
    .map(attribute => attribute.split("/")[0])
    .filter(onlyUnique);

// IMPURE FUNCTION
function getHullSchema({ type = "user" }) {
  const { statusCode, body, error } = api("post", "schema", { type });
  if (statusCode > 200) {
    if (body && body.error === "Invalid Token") {
      throw new Error(body.error);
    }
    throw new Error(
      `Error fetching attributes: ${error || (body && body.error)}`
    );
  }
  return {
    hullGroups: getGroupsFromSchema(body),
    hullAttributes: body
  };
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

function getSelectedRows() {
  const range = getSelectedRange();
  return {
    firstRow: range.getRow(),
    lastRow: range.getLastRow()
  };
}

function importData({ index, type, mapping, claims, context }) {
  const { firstRow, lastRow } = getSelectedRows(index);
  let startRow = firstRow;
  let chunk = 1;
  Logger.log("Importing Data", {
    index,
    firstRow,
    lastRow,
    startRow,
    chunk,
    type,
    mapping,
    context,
    claims
  });
  const stats = { imported: 0, empty: 0, errors: 0, skipped: 0 };
  const errors = [];
  while (startRow <= lastRow && chunk < MAX_CHUNKS) {
    const payloads = getRows({
      index,
      startRow,
      rows: Math.min(IMPORT_CHUNK_SIZE, lastRow - (startRow - 1)),
      mapping,
      context,
      claims
    });
    Logger.log("Payloads", payloads);
    const importResponse = importPayloads({
      payloads,
      type
    });
    Logger.log("ImportResponse", importResponse);
    if (!importResponse) break;
    chunk += 1;
    startRow += IMPORT_CHUNK_SIZE;
    errors.push(...importResponse.errors);
    incrementStats({ stats, errors }, [payloads, importResponse]);
    setDocumentProp({
      key: "importProgress",
      index,
      value: stats
    });
    setDocumentProp({
      key: "importErrors",
      index,
      value: errors
    });
  }
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
    range: getSelectedRows(),
    googleColumns: getColumnNames(index),
    importErrors:
      getDocumentProp({
        key: "importErrors",
        index,
        fallback: []
      }) || [],
    importProgress:
      getDocumentProp({
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

function bootstrap(index, token) {
  if (!index) {
    return {
      error: "No active Sheet"
    };
  }
  try {
    const source =
      getDocumentProp({
        key: "source",
        index,
        fallback: ""
      }) || "";
    const type =
      getDocumentProp({
        key: "type",
        index,
        fallback: "user"
      }) || "user";
    Logger.log("Token", token);
    const appToken = token || getUserProp({ key: "token" });
    if (!appToken) {
      return {
        token: undefined,
        initialized: false
      };
    }
    const { hullAttributes, hullGroups } = getHullSchema({ type });
    return {
      token: appToken,
      initialized: true,
      googleColumns: getColumnNames(index),
      user_mapping: getSheetMapping(index, "user"),
      user_claims: getSheetClaims(index, "user"),
      account_mapping: getSheetMapping(index, "account"),
      account_claims: getSheetClaims(index, "account"),
      user_event_mapping: getSheetMapping(index, "user_event"),
      user_event_claims: getSheetClaims(index, "user_event"),
      user_event_context: getSheetContext(index, "user_event"),
      index,
      source,
      type,
      hullAttributes,
      hullGroups
    };
  } catch (err) {
    return {
      error: err.toString()
    };
  }
}

function saveConfig({ index, data }) {
  Logger.log("saveConfig", prefixAndStringify({ prefix: index, data }));
  try {
    PropertiesService.getDocumentProperties().setProperties(
      prefixAndStringify({ prefix: index, data })
    );
    return bootstrap(index);
  } catch (err) {
    Logger.log("error in saveConfig", err);
  }
}
