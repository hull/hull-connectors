// @flow

import React, { Component } from "react";
import ace from "ace-builds";
import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-elastic_tabstops_lite";
import "ace-builds/src-noconflict/ext-error_marker";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/snippets/javascript";
import "ace-builds/src-noconflict/snippets/json";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/keybinding-sublime";
import "../ace/src/vendor/jsonata/formatter";
import "../ace/src/vendor/jsonata/mode-jsonata";
import "../ace/src/vendor/jsonata/snippets-jsonata";
// import "../ace/src/vendor/jsonata/worker-jsonata";

import AceEditor from "react-ace";

ace.require("ace/keyboard/sublime");
ace.require("ace/theme/clouds_midnight");

ace.require("ace/mode/javascript");
ace.require("ace/mode/markdown");
ace.require("ace/mode/json");
ace.require("ace/mode/text");
ace.require("ace/mode/jsonata");

ace.require("ace/snippets/javascript");
ace.require("ace/snippets/jsonata");
ace.require("ace/snippets/json");

ace.require("ace/ext/beautify");
ace.require("ace/ext/error_marker");
ace.require("ace/ext/searchbox");
ace.require("ace/ext/elastic_tabstops_lite");
ace.require("ace/ext/language_tools");

type Props = {
  className?: string,
  id: string,
  readOnly: boolean,
  aceOptions?: { [string]: any },
  onChange?: string => void,
  mode: string,
  value: string,
  focusOnLoad?: boolean
};
type State = {
  value: string
};

class CodeEditor extends Component<Props, State> {
  code: any;

  state = {
    /* eslint-disable-next-line react/destructuring-assignment */
    value: this.props.value
  };

  constructor(props: Props) {
    super(props);
    this.code = React.createRef();
  }

  focusCodeInput() {
    // Explicitly focus the text input using the raw DOM API
    // Note: we're accessing "current" to get the DOM node
    this.code.current.editor.focus();
  }
  // onBeforeChange = (editor: any, data: any, value: string) =>

  onChange = (value: string) => {
    this.setState({ value });
    const { onChange } = this.props;
    if (onChange) {
      onChange(value);
    }
  };

  onValidate = (_annotations: any) => {
    // console.log(annotations);
  };

  componentDidMount() {
    if (this.props.focusOnLoad) {
      this.focusCodeInput();
    }
  }

  UNSAFE_componentWillReceiveProps = (nextProps: Props) => {
    /* eslint-disable-next-line react/destructuring-assignment */
    if (nextProps.value !== this.state.value) {
      this.setState({ value: nextProps.value });
    }
  };

  render() {
    const { id, mode, className, readOnly, aceOptions } = this.props;
    const { value } = this.state;
    return (
      <AceEditor
        ref={this.code}
        {...aceOptions}
        mode={mode}
        className={`${className || ""} ${readOnly ? "read-only" : ""}`}
        theme="clouds_midnight"
        width="auto"
        tabSize={2}
        fontSize={12}
        showPrintMargin
        showGutter
        enableBasicAutocompletion
        enableLiveAutocompletion
        highlightActiveLine
        value={value}
        onChange={this.onChange}
        onValidate={this.onValidate}
        name={id}
        // name="UNIQUE_ID_OF_DIV"
        setOptions={{
          keyboardHandler: "ace/keyboard/sublime",
          useElasticTabstops: true,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,

          selectionStyle: "line",
          highlightSelectedWord: true,
          readOnly,
          cursorStyle: "smooth",
          autoScrollEditorIntoView: true,
          copyWithEmptySelection: true,
          useSoftTabs: true,
          navigateWithinSoftTabs: true,
          enableMultiselect: true,
          highlightGutterLine: true,
          animatedScroll: true,
          fontSize: "12px",
          fontFamily:
            "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace"
        }}
        editorProps={{ $blockScrolling: true }}
      />
    );
  }
}

export default CodeEditor;
