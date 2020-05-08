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
function getColumnNames(activeSheetIndex) {
  // activeSheetIndex - 1 because https://developers.google.com/apps-script/reference/spreadsheet/sheet#getindex - spreadsheets are 1-indexed
  return (
    SpreadsheetApp.getActiveSpreadsheet()
      .getSheets()
      [activeSheetIndex - 1].getRange(1, 1, 1, MAX_COLUMNS)
      .getValues()[0] || []
  ).filter(v => !!v);
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

const getGroup = name =>
  ["email", "external_id"].indexOf(name) > -1 ? "claims" : "traits";

const reduceRow = row => mapping =>
  mapping.reduce(
    (line, key, columnNumber) => {
      const value = getVal(row[columnNumber]);
      const group = getGroup(key);
      if (key && value) {
        line[group][key] = value;
      }
      return line;
    },
    {
      claims: {},
      traits: {}
    }
  );

function fetchRows(startRow, chunkSize, mapping) {
  return SpreadsheetApp.getActiveSheet()
    .getRange(startRow, 1, chunkSize, mapping.length)
    .getValues()
    .map(reduceRow(mapping));
}

const importRow = (memo, row) => {
  const { claims, traits } = row;
  if (Object.keys(traits).length === 0 || Object.keys(claims).length === 0) {
    memo.stats.skipped += 1;
  } else {
    memo.stats.imported += 1;
    memo.rows.push(row);
  }
  return memo;
};

const getHullField = ({ hullField }) => hullField;

const getHullMapping = activeSheetIndex =>
  getSheetMapping(activeSheetIndex).map(getHullField);

function importRange(startRow, chunkSize, mapping) {
  const fetched = fetchRows(startRow, chunkSize, mapping).reduce(importRow, {
    rows: [],
    errors: [],
    stats: { imported: 0, empty: 0, errors: 0 }
  });

  if (fetched.rows && fetched.rows.length > 0) {
    try {
      api("post", "import", fetched);
    } catch (err) {
      Logger.log("Error while importing", err);
      fetched.stats.errors += 1;
      fetched.errors.push(err.toString());
    }
    return fetched;
  }
  return undefined;
}

const incrementStats = stats => ret => k => {
  stats[k] += ret.stats[k] || 0;
  return undefined;
};

function getHullAttributes({ type = "user", source = "" }) {
  const { statusCode, body } = api("post", "schema", { type, source });
  if (statusCode > 200) {
    throw new Error(`Error fetching attributes: ${body.error}`);
  }
  return body;
}

function importData(activeSheetIndex) {
  let startRow = 2;
  let chunk = 1;
  const stats = { imported: 0, empty: 0, errors: 0, skipped: 0 };
  const errors = [];
  const mapping = getHullMapping(activeSheetIndex);
  const incrementStatsFor = incrementStats(stats);

  while (startRow && chunk < MAX_CHUNKS) {
    const ret = importRange(startRow, IMPORT_CHUNK_SIZE, mapping);
    if (!ret) break;
    chunk += 1;
    startRow += IMPORT_CHUNK_SIZE;
    errors.push(...ret.errors);
    const increment = incrementStatsFor(ret);
    Object.keys(stats).forEach(increment);
    setUserProp({
      key: "importProgress",
      index: activeSheetIndex,
      value: stats
    });
    setUserProp({
      key: "importErrors",
      index: activeSheetIndex,
      value: errors
    });
  }

  setUserProp({
    key: "importProgress",
    index: activeSheetIndex,
    value: {}
  });
  setUserProp({
    key: "importErrors",
    index: activeSheetIndex,
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
  const activeSheetIndex = sheet.getIndex();
  return {
    activeSheetIndex,
    name: sheet.getName(),
    googleColumns: getColumnNames(activeSheetIndex),
    importErrors: getUserProp({
      key: "importErrors",
      index: activeSheetIndex
    }),
    importProgress: getUserProp({
      key: "importProgress",
      index: activeSheetIndex
    })
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

function bootstrap(activeSheetIndex) {
  if (!activeSheetIndex) {
    return {
      error: "No active Sheet"
    };
  }
  const source =
    getUserProp({
      key: "source",
      index: activeSheetIndex,
      fallback: ""
    }) || "";
  const type =
    getUserProp({
      key: "type",
      index: activeSheetIndex,
      fallback: "user"
    }) || "user";
  return {
    token: getUserProp({ key: "token" }),
    googleColumns: getColumnNames(activeSheetIndex),
    hullAttributes: getHullAttributes({ type, source }),
    user_mapping: getSheetMapping(activeSheetIndex, "user"),
    user_claims: getSheetClaims(activeSheetIndex, "user"),
    account_mapping: getSheetMapping(activeSheetIndex, "account"),
    account_claims: getSheetClaims(activeSheetIndex, "account"),
    user_event_mapping: getSheetMapping(activeSheetIndex, "user_event"),
    user_event_claims: getSheetClaims(activeSheetIndex, "user_event"),
    activeSheetIndex,
    source,
    type
  };
}

function setUserProps({ index, data }) {
  Logger.log("SetUserProps", { index, data });
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
