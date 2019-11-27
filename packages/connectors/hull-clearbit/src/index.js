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

const changeButton = disabled => (text, btn) =>
  btn.text(text).prop("disabled", disabled);

const enableButton = changeButton(false);
const disableButton = changeButton(true);

window.nameFormatter = (value, row) => row.name.fullName;

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
  disableButton(STRINGS.BTN_IMPORT_LOADING, button);
  const prospects = container.bootstrapTable("getSelections");
  const { error } = await request({ url: "/save", data: { prospects } });
  if (!error) {
    container.bootstrapTable("uncheckAll");
    enableButton(STRINGS.BTN_IMPORT_DEFAULT, button);
    updateImportButtonStatus(button, 0);
    button.text("Import Successful");
  } else {
    enableButton(STRINGS.BTN_IMPORT_DEFAULT, button);
    button.text(`Import Failed: ${error}`);
  }
  // debugger;
};

export default function boot() {
  $(() => {
    const $btn_prospect = $("button#prospect");
    const $btn_import = $("button#import");
    const $domains = $("#domains");
    const $titles = $("#titles");
    const $role = $("#role");
    const $seniority = $("#seniority");
    // const $limit = $("#limit");
    updateImportButtonStatus($btn_import, 0);

    const container = $("#results");
    const errorContainer = $("#errors");
    errorContainer.hide();

    $btn_import.prop("disabled", true).on("click", onImport(container));

    container
      .on(
        "check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table",
        function onSelect() {
          updateImportButtonStatus(
            $btn_import,
            container.bootstrapTable("getSelections").length
          );
        }
      )
      .bootstrapTable("refreshOptions", {
        classes: "table table-borderless table-hover"
      });

    const updateState = () => {
      const data = {};
      const titles = $titles
        .val()
        .map(d => d.trim())
        .filter(d => d.length > 0);
      const domains = $domains
        .val()
        .map(d => d.trim())
        .filter(d => d.length > 0);
      ["role", "seniority", "limit"].forEach(k => {
        const val = $(`#${k}`).val();
        if (val && val.length > 0) {
          data[k] = val;
        }
      });
      if (titles.length && domains.length) {
        enableButton(STRINGS.BTN_DEFAULT, $btn_prospect);
      } else {
        disableButton(STRINGS.BTN_DEFAULT, $btn_prospect);
      }
      return { domains, titles };
    };

    $role
      .select2({ theme: "bootstrap", closeOnSelect: false })
      .on("change", updateState);
    $seniority
      .select2({ theme: "bootstrap", closeOnSelect: false })
      .on("change", updateState);
    $domains
      .select2({
        theme: "bootstrap",
        tags: true,
        tokenSeparators: [",", " "],
        placeholder: STRINGS.DOMAINS_PLACEHOLDER,
        closeOnSelect: true
      })
      .on("change", updateState);
    $titles
      .select2({
        theme: "bootstrap",
        tags: true,
        placeholder: STRINGS.TITLES_PLACEHOLDER,
        closeOnSelect: true
      })
      .on("change", updateState);

    updateState();

    $("form#prospect-form").on("submit", async evt => {
      evt.preventDefault();
      const data = updateState();
      disableButton(STRINGS.BTN_LOADING, $btn_prospect);
      errorContainer.hide();
      const { error, prospects } = await request({ url: "/prospect", data });
      if (error) {
        errorContainer.html(renderError(error)).show();
      }
      if (prospects && prospects.length) {
        errorContainer.empty().hide();
        $btn_prospect.show();
        renderResults({ container, data: prospects });
      }
      enableButton(STRINGS.BTN_DEFAULT, $btn_prospect);
    });
  });
}

boot();
