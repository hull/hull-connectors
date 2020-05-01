/* global Logger, SpreadsheetApp, PropertiesService, UrlFetchApp, HtmlService */
/* eslint-disable prefer-template, object-shorthand */
function onInstall() {
  addMenu();
}

function onOpen() {
  addMenu();
}

function addMenu() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createAddonMenu();
  menu.addItem("Open", "showSidebar");
  menu.addToUi();
}

function clearAll() {
  PropertiesService.getUserProperties().deleteAllProperties();
}

function urlFor(path /* , _params */) {
  return "https://hull-google-sheets.eu.ngrok.io/" + path;
}

function showSidebar() {
  const sidebar = HtmlService.createTemplateFromFile("Sidebar").evaluate();
  sidebar.setTitle("Hull");
  SpreadsheetApp.getUi().showSidebar(sidebar);
}

function getActiveSheet() {
  return {
    activeSheetIndex: getActiveSheetIndex(),
    importProgress: getActiveSheetImportProgress()
  };
}

function getActiveSheetIndex() {
  return SpreadsheetApp.getActiveSheet().getIndex();
}

function getColumnNames(activeSheetIndex) {
  const spreadsheet = SpreadsheetApp.getSheets();
  const values = spreadsheet[activeSheetIndex]
    .getRange(1, 1, 1, 256)
    .getValues()[0];

  if (!values) return [];

  const columns = values.reverse().reduce(function reduceValues(cols, col) {
    return cols || col.length ? (cols || []).concat([col]) : cols;
  });
  if (!columns) return [];
  return columns.reverse();
}

function setUserProp(key, value) {
  PropertiesService.getUserProperties().setProperty(key, JSON.stringify(value));
  return value;
}

function getUserProp(key, fallback) {
  const val = PropertiesService.getUserProperties().getProperty(key);
  if (val && (val.toString()[0] === "{" || val.toString()[0] === "[")) {
    try {
      return JSON.parse(val);
    } catch (err) {
      return fallback || val;
    }
  }
  return val || fallback;
}

function getActiveSheetMapping(activeSheetIndex) {
  return getUserProp("mapping-" + activeSheetIndex, []);
}

function getActiveSheetType(activeSheetIndex) {
  return getUserProp("type-" + activeSheetIndex, []);
}

function getActiveSheetImportProgress() {
  const activeSheetIndex = getActiveSheetIndex();
  return getUserProp("importProgress-" + activeSheetIndex, {});
}

function setActiveSheetImportProgress(progress) {
  const activeSheetIndex = getActiveSheetIndex();
  return setUserProp("importProgress-" + activeSheetIndex, progress);
}

function api(method, path, data) {
  const settings = getUserProp("settings", {});

  if (!settings.hullToken) return { statusCode: 401 };

  const options = {
    muteHttpExceptions: true,
    contentType: "application/json",
    method: method
  };

  if (method !== "get" && data) {
    options.payload = JSON.stringify(data);
  }

  const res = UrlFetchApp.fetch(
    urlFor(path + "?token=" + settings.hullToken),
    options
  );

  const ret = { statusCode: res.getResponseCode() };
  try {
    ret.body = JSON.parse(res.getContentText());
  } catch (err) {
    ret.error = err;
  }

  return ret;
}

function importData(activeSheetIndex) {
  var settings = getUserProp("settings", {});
  var numRows = 100;
  var startRow = 2;
  var rows = [];
  var chunk = 1;
  var fetched;
  var stats = { imported: 0, skipped: 0, empty: 0 };

  const mapping = getActiveSheetMapping(activeSheetIndex).map(function(m) {
    if (m) return m.hullField;
  });

  while (startRow && chunk < 10000) {
    var ret = importRange(startRow, numRows, mapping);
    if (!ret) break;
    chunk += 1;
    startRow += numRows;
    Object.keys(stats).forEach(function(k) {
      stats[k] += ret.stats[k] || 0;
    });
    setActiveSheetImportProgress(stats);
  }

  setActiveSheetImportProgress({});

  return stats;
}

function getVal(val) {
  if (val != null && val.toString && val.toString().length > 0) return val;
  return undefined;
}

function fetchRows(startRow, numRows, mapping) {
  // Make sure we skip the header row
  const start = startRow === 1 ? 2 : startRow;

  // Fetch data from range
  const data = SpreadsheetApp.getActiveSheet()
    .getRange(start, 1, numRows, mapping.length)
    .getValues();

  // Map values according to mapping
  return data.map(function mapRow(row) {
    return mapping.reduce(
      function reduceRow(line, key, col) {
        const val = getVal(row[col]);
        const grp =
          ["email", "external_id"].indexOf(key) > -1 ? "ident" : "traits";
        if (key && val) line[grp][key] = val;
        return line;
      },
      { ident: {}, traits: {} }
    );
  });
}

function importRange(startRow, numRows, mapping) {
  const fetched = fetchRows(startRow, numRows, mapping).reduce(
    function importer(memo, row) {
      if (
        Object.keys(row.traits).length === 0 ||
        Object.keys(row.ident).length === 0
      ) {
        memo.stats.skipped += 1;
      } else {
        memo.stats.imported += 1;
        memo.rows.push(row);
      }
      return memo;
    },
    { rows: [], stats: { empty: 0, imported: 0 } }
  );

  if (fetched.rows && fetched.rows.length > 0) {
    api("post", "import", fetched);
    return fetched;
  }
  return undefined;
}

function getHullAttributes(activeSheetIndex, fieldType, settings) {
  const type = fieldType || "user";
  if (!settings.hullToken) return [];
  const response = api("post", "schema", { type: type });

  if (response.statusCode !== 200) {
    return [];
  }

  return response.body;
}

function bootstrap(activeSheetIndex) {
  const props = {};
  props.activeSheetIndex = activeSheetIndex;
  props.mapping = getActiveSheetMapping(activeSheetIndex);
  props.type = getActiveSheetType(activeSheetIndex);
  props.settings = getUserProp("settings", {});
  props.googleColumns = getColumnNames(activeSheetIndex);
  props.hullAttributes = getHullAttributes(
    activeSheetIndex,
    props.type,
    props.settings
  );
  Logger.log(props);
  return props;
}
