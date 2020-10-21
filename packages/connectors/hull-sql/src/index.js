/* @noflow */
/* global original_query, swal */
import CodeMirror from "codemirror";
import $ from "jquery";
import _ from "lodash";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/sql/sql.js";
import bootstrapTable from "bootstrap-table";
import Swal from "sweetalert2";
const swal = Swal.mixin({
  customClass: {
    confirmButton: "btn btn-success",
    cancelButton: "btn btn-danger"
  },
  buttonsStyling: false
});
window.$ = $;

const formatter = value =>
  typeof value === "object" && value !== null
    ? `pre style='min-width:200px'><code>${JSON.stringify(value)}</code></pre>`
    : value;

const getColumnType = (entries, columnName) => {
  try {
    if (entries && entries.length) {
      const values = entries.reduce((ret, e) => {
        const val = e && e[columnName];
        if (val) ret.push(val);
        return ret;
      }, []);
      return values[0] && values[0].constructor && values[0].constructor.name;
    }
  } catch (err) {
    return "";
  }
  return "";
};

const emitToParent = query =>
  window.parent.postMessage(
    JSON.stringify({
      from: "embedded-ship",
      action: "update",
      ship: { private_settings: { query } }
    }),
    "*"
  );

(function boot() {
  let good_query = null;
  let stored_query = "";
  let datatable = null;
  const button_import = $("#button_import");
  const button_preview = $("#button_preview");
  const changed_indicator = $("#changed-indicator");
  const preview_query = $("#preview-query");
  const preview_results = $("#preview-results");
  const preview_error = $("#preview-error");
  const preview_loading = $("#preview-loading");
  const maximize = $(".btn-maximize");
  const body = $("body");

  function empty() {
    body.removeClass("maximized");
    preview_query.empty().hide();
    preview_results.hide();
    preview_error.empty().hide();
    $("#result thead tr").empty();
    $("#result tbody").empty();
    $("#results-title").empty();
  }

  $(() => {
    const editor = CodeMirror.fromTextArea(
      document.getElementById("querying"),
      {
        mode: "text/x-pgsql",
        indentWithTabs: false,
        parserfile: "codemirror/contrib/sql/js/parsesql.js",
        path: "codemirror/js/",
        theme: "material-ocean",
        stylesheet: "css/sqlcolors.css",
        smartIndent: true,
        lineNumbers: true,
        matchBrackets: true,
        autofocus: true
      }
    );

    function updateChangedStatus() {
      const current_query = editor.getValue();
      if (
        stored_query !== undefined &&
        stored_query &&
        current_query !== stored_query
      ) {
        changed_indicator.show();
      } else {
        changed_indicator.hide();
      }
    }

    window.addEventListener("message", event => {
      const message = event.data;
      if (
        message &&
        message.from === "hull-dashboard" &&
        message.action === "update"
      ) {
        const { ship } = message;
        if (ship) {
          stored_query = ship.private_settings.query;
        }
        updateChangedStatus();
      }
    });

    function getStoredQuery() {
      $.ajax({
        url: `/storedquery${window.location.search}`,
        type: "get",
        success(data) {
          stored_query = data.query;
          updateChangedStatus();
        },
        error(err) {
          swal.fire({
            title: "Stored query",
            text: `Failed to load stored query: ${err.message || err.status}`,
            icon: "error",
            confirmButtonText: "Ok"
          });
        }
      });
    }

    editor.on(
      "change",
      _.debounce(() => {
        const query = editor.getValue();
        emitToParent(query);
        updateChangedStatus();
      }, 100)
    );

    button_import.click(() => {
      const query = editor.getValue();

      if (query === "") {
        return swal.fire({
          title: "Empty query",
          text: "The current query is empty",
          icon: "warning"
        });
      }

      if (query !== stored_query) {
        return swal.fire({
          title: "Unsaved Query",
          text:
            "The current query you ran is not the query you saved. Please save your query first.",
          icon: "warning"
        });
      }

      return swal
        .fire({
          title: "Import the users from the current query? ",
          text:
            "If you continue, we will import the users from the currently saved query.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Let's Go",
          closeOnConfirm: false
        })
        .then(userRes => {
          const { isConfirmed } = userRes;
          if (isConfirmed === true) {
            button_import.prop("disabled", true);
            button_import.text("Importing...");
            empty();

            Swal.fire({
              title: "Started importing users",
              text: "Results will be available shortly in Hull!",
              icon: "success"
            });

            $.ajax({
              url: `/import${window.location.search}`,
              type: "post",
              data: {
                query,
                incremental: true
              },
              success() {
                button_import.text("Import");
                button_import.prop("disabled", false);
              },
              error(err) {
                let error = "";
                if (err.responseJSON) {
                  error = err.responseJSON.message;
                } else {
                  error = err.message || err.status;
                }
                $(".to-disable").prop("disabled", false);
                preview_error
                  .empty()
                  .css("display", "block")
                  .append(error);
              }
            });
          }
        });
    });

    button_preview.click(() => {
      empty();
      good_query = null;

      const query = editor.getValue();

      if (query === "" || query === "-- Write your SQL query here;") {
        return swal.fire(
          "Empty query",
          "The current query is empty",
          "warning"
        );
      }

      $(".to-disable").prop("disabled", true);
      preview_loading.show();
      $("#result").bootstrapTable("destroy");
      datatable = null;
      $.ajax({
        url: `/run${window.location.search}`,
        type: "post",
        data: { query },
        success(data) {
          $(".to-disable").prop("disabled", false);
          preview_loading.hide();

          try {
            if (data.errors && data.errors.length > 0) {
              preview_error.empty();
              data.errors.forEach(error =>
                preview_error.append(`${error}<br />`)
              );
              preview_error.show();
              preview_results.hide();
              good_query = null;
            } else if (data.entries && data.entries.length) {
              const columnFormatter = name =>
                `<em>${name}</em><small>(${getColumnType(
                  data.entries,
                  name
                )})</small>`;

              preview_results.show();

              datatable = $("#result").bootstrapTable({
                height: 500,
                sortable: true,
                classes: "table table-striped table-borderless",
                data: _.tail(data.entries),
                columns: _.map(_.keys(_.first(data.entries)), field => ({
                  field,
                  formatter,
                  sortable: true,
                  title: columnFormatter(field)
                }))
              });
              good_query = query;
            } else {
              preview_error
                .empty()
                .show()
                .append("No results for this query.");

              good_query = query;
            }
          } catch (err) {
            console.log(err);
            good_query = stored_query;

            preview_error
              .empty()
              .show()
              .append(data.message || err.toString());
          } finally {
            if (good_query !== null && good_query !== stored_query) {
              emitToParent(good_query);
            }
          }
        },
        error(res) {
          const err = res.responseJSON;
          $(".to-disable").prop("disabled", false);
          preview_loading.hide();
          if (res.responseText==="transient-error"){
            preview_error
              .empty()
              .show()
              .append("An error occurred. It seems the server wasn't able to get a proper response from the Database");
          }
          if (err) {
            const message =
              err.message === "Timeout error"
                ? "The query took more than 45 seconds to return any result. If you are sure the query is correct, you can save it and run a full import."
                : err.message;
            preview_error
              .empty()
              .show()
              .append(message);
            good_query = stored_query;
            emitToParent(good_query);
            preview_results.show();
          }
        }
      });

      return false;
    });

    function updateDataTable() {
      const result = $("#result");
      const area = result.parents(".area");
      if (datatable) {
        result.bootstrapTable("resetView", {
          height: area.hasClass("maximized")
            ? result.parents(".area-content").height()
            : 500
        });
      }
    }
    maximize.on("click", function toggleMaximized(e) {
      const area = $(e.target).parents(".area");
      area.toggleClass("maximized");
      body.toggleClass("maximized");
      updateDataTable();
    });

    $(window).resize(updateDataTable);

    getStoredQuery();
  });
})();
