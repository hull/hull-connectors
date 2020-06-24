/* @flow */
/* global original_query, swal */
import CodeMirror from "codemirror";
import $ from "jquery";
import _ from "lodash";
import "codemirror/lib/codemirror.css";
import "sweetalert/dist/sweetalert.css";
import "sweetalert";
import "codemirror/mode/sql/sql.js";

(function boot() {
  let good_query = null;
  let stored_query = "";
  const { swal } = window;

  const button_import = $("#button_import");
  const button_preview = $("#button_preview");
  const changed_indicator = $("#changed-indicator");
  const preview_query = $("#preview-query");
  const preview_results = $("#preview-results");
  const preview_error = $("#preview-error");
  const preview_loading = $("#preview-loading");

  $(() => {
    const editor = CodeMirror.fromTextArea(
      document.getElementById("querying"),
      {
        mode: "text/x-pgsql",
        indentWithTabs: false,
        parserfile: "codemirror/contrib/sql/js/parsesql.js",
        path: "codemirror/js/",
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
          swal(
            "Stored query",
            `Failed to load stored query: ${err.message || err.status}`,
            "error"
          );
        }
      });
    }

    function emitToParent(query) {
      window.parent.postMessage(
        JSON.stringify({
          from: "embedded-ship",
          action: "update",
          ship: {
            private_settings: {
              query
            }
          }
        }),
        "*"
      );
    }

    editor.on(
      "change",
      _.debounce(() => {
        const query = editor.getValue();
        emitToParent(query);
        updateChangedStatus();
      }, 100)
    );

    $(".to-disable").prop("disabled", false);

    getStoredQuery();

    function empty() {
      preview_query.empty().hide();
      preview_results.hide();
      preview_error.empty().hide();
      $("#result thead tr").empty();
      $("#result tbody").empty();
      $("#results-title").empty();
    }

    button_import.click(() => {
      const query = editor.getValue();

      if (query === "") {
        return swal("Empty query", "The current query is empty", "warning");
      }

      if (query !== stored_query) {
        return swal(
          "Unsaved query",
          "The current query you ran is not the query you saved. Please save your query first.",
          "warning"
        );
        // return swal("Unsaved query", `The current query '${query}' is not the query you saved. Please save your query first.`, "warning");
      }

      return swal(
        {
          title: "Import the users from the current query? ",
          text:
            "If you continue, we will import the users from the currently saved query.",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Let's Go",
          closeOnConfirm: false
        },
        isConfirm => {
          if (isConfirm === true) {
            button_import.prop("disabled", true);
            button_import.text("Importing...");
            empty();

            swal(
              "Started importing users. Results will be available shortly in Hull!"
            );

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
        }
      );
    });

    function getColumnType(entries, columnName): string {
      try {
        if (entries && entries.length) {
          const values = entries.reduce((ret, e) => {
            const val = e && e[columnName];
            if (val) ret.push(val);
            return ret;
          }, []);
          return (
            values[0] && values[0].constructor && values[0].constructor.name
          );
        }
      } catch (err) {
        return "";
      }
      return "";
    }

    button_preview.click(() => {
      empty();
      good_query = null;

      const query = editor.getValue();

      if (query === "") {
        return swal("Empty query", "The current query is empty", "warning");
      }

      $(".to-disable").prop("disabled", true);
      preview_loading.show();

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

              data.errors.forEach(error => {
                preview_error.append(`${error}<br />`);
              });

              preview_error.show();

              preview_results.hide();

              good_query = null;
            } else if (data.entries && data.entries.length) {
              _.forEach(data.entries[0], (value, columnName) => {
                $("#result thead tr").append(
                  `<th>${columnName}<em>(${getColumnType(
                    data.entries,
                    columnName
                  )})</em></th>`
                );
              });

              data.entries.forEach(element => {
                const currentRow = [];
                $.each(element, (key, value) => {
                  currentRow.push(
                    `<td><small>${
                      typeof value === "object" && value !== null
                        ? `<pre style='min-width:200px'><code>${JSON.stringify(
                            value
                          )}</code></pre>`
                        : $("<div>").text(value).html()
                    }</small></td>`
                  );
                });
                $("#result tbody").append(`<tr>${currentRow.join("")}<tr>`);
              });

              good_query = query;

              preview_results.show();
            } else {
              preview_error
                .empty()
                .show()
                .append("No results for this query.");

              good_query = query;
            }
          } catch (err) {
            good_query = stored_query;

            preview_error
              .empty()
              .show()
              .append(data.message);
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
  });
})();
