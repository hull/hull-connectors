/* eslint-disable */
import jsonata from "jsonata";

ace.define("ace/snippets/jsonata", ["require", "exports", "module"], function(
  require,
  exports,
  module
) {
  let snippetText = "";
  for (const fn in jsonata.functions) {
    if (jsonata.functions.hasOwnProperty(fn)) {
      snippetText += `# ${fn}\nsnippet ${fn}\n\t${jsonata.getFunctionSnippet(
        fn
      )}\n`;
    }
  }
  exports.snippetText = snippetText;
  exports.scope = "jsonata";
});
