// eslint-disable-line no-unused-vars
import * as STRINGS from "./app/strings";

const $ = require("jquery");

window.$ = $;
const select2 = require("select2"); // eslint-disable-line no-unused-vars
// import _ from "lodash";
const bootstrapTable = require("bootstrap-table/src/bootstrap-table"); // eslint-disable-line no-unused-vars

const renderError = err =>
  `<div class="alert alert-error" role="alert">${
    STRINGS.FETCH_ERROR
  }: ${(err.responseJSON ? err.responseJSON.error : err.responseText) ||
    err.toString()}.</div>`;

const renderResults = ({ container, data }) =>
  container.bootstrapTable("load", data);

const changeButton = (text, disabled) => btn =>
  btn.text(text).prop("disabled", disabled);

const enableActionButton = changeButton(STRINGS.BTN_DEFAULT, false);

const disableActionButton = changeButton(STRINGS.BTN_LOADING, true);

const enableImportButton = changeButton(STRINGS.BTN_IMPORT_DEFAULT, false);

const disableImportButton = changeButton(STRINGS.BTN_IMPORT_LOADING, true);

const request = async ({ url, data }) => {
  try {
    const response = await fetch(`${url}${document.location.search}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      dataType: "json",
      body: JSON.stringify(data),
      timeout: 30000
    });
    const json = await response.json();
    if (!response.ok && !json.error) {
      return {
        error: "An error occurred. We've been notified"
      };
    }
    return json;
  } catch (err) {
    return { error: err.toString() };
  }
};
const updateImportButtonStatus = (button, selected) =>
  button
    .prop("disabled", !selected)
    .text(`${STRINGS.BTN_IMPORT_DEFAULT} (${selected})`);

const onImport = container => async ev => {
  const button = $(ev.target);
  disableImportButton(button);
  const prospects = container.bootstrapTable("getSelections");
  const { error } = await request({ url: "/save", data: { prospects } });
  if (!error) {
    container.bootstrapTable("uncheckAll");
    enableImportButton(button);
    updateImportButtonStatus(button, 0);
    button.text("Import Successful");
  } else {
    enableImportButton(button);
    button.text(`Import Failed: ${error}`);
  }
  // debugger;
};

export default function boot() {
  $(() => {
    const $btn_prospect = $("button#prospect");
    const $btn_import = $("button#import");
    const container = $("#results");
    $btn_import.prop("disabled", true);
    container.on(
      "check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table",
      function onSelect() {
        updateImportButtonStatus(
          $btn_import,
          container.bootstrapTable("getSelections").length
        );
      }
    );
    // renderResults({ container, data: p });
    $btn_import.on("click", onImport(container));

    $("#role").select2({ theme: "bootstrap", closeOnSelect: false });
    $("#seniority").select2({ theme: "bootstrap", closeOnSelect: false });
    $("#domains").select2({
      theme: "bootstrap",
      tags: true,
      tokenSeparators: [",", " "],
      placeholder: STRINGS.DOMAINS_PLACEHOLDER,
      closeOnSelect: true
    });
    $("#titles").select2({
      theme: "bootstrap",
      tags: true,
      placeholder: STRINGS.TITLES_PLACEHOLDER,
      closeOnSelect: true
    });

    $("form#prospect-form").on("submit", async evt => {
      evt.preventDefault();
      const titles = $("#titles")
        .val()
        .map(d => d.trim())
        .filter(d => d.length > 0);
      const domains = $("#domains")
        .val()
        .map(d => d.trim())
        .filter(d => d.length > 0);
      if (domains.length === 0) {
        return;
      }

      const data = { domains, titles };

      ["role", "seniority", "limit"].forEach(k => {
        const val = $(`#${k}`).val();
        if (val && val.length > 0) {
          data[k] = val;
        }
      });
      disableActionButton($btn_prospect);
      const { error, prospects } = await request({ url: "/prospect", data });
      if (error) {
        $("#results").html(renderError(error));
      }
      if (prospects && prospects.length) {
        $btn_prospect.show();
        renderResults({ container, data: prospects });
      }
      enableActionButton($btn_prospect);
    });
  });
}

boot();
