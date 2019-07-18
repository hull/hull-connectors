// @flow
import React from "react";
import _ from "lodash";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";

const SHORTCUTS = {
  "Cmd-/": "Toggle Comment",

  "Cmd-Alt-[": "Fold Block",
  "Cmd-Alt-]": "Unfold Block",
  "Ctrl-Q": "Toggle Folding on Block",

  "Cmd-Left": "Line Start",
  "Cmd-Right": "Line End",

  Tab: "Indent Block",
  "Shift-Tab": "Un-indent block",

  "Cmd-J": "Join Lines",
  "Cmd-L": "Select Line",
  "Shift-Cmd-D": "Duplicate Line",

  "Cmd-Z": "Undo",
  "Cmd-Shift-Z": "Redo",

  "Shift-Ctrl-K": "Delete Line",
  "Cmd-Enter": "Insert line after",

  "Cmd-Ctrl-Up": "Move Line Up",
  "Cmd-Ctrl-Down": "Move Line Down",

  "Shift-Cmd-M": "Select between brackets",
  "Cmd-M": "Go to Bracket",

  "Cmd-D": "Select next occurrence of word (Sublime-Style Multi-select)",
  "Shift-Cmd-L": "Split selection by line (Sublime-Style Multi-edit)"
};

// const HIDDEN_BINDINGS = {
//   "Ctrl-Left": "goSubwordLeft",
//   "Ctrl-Right": "goSubwordRight",
//   "Ctrl-Alt-Up": "scrollLineUp",
//   "Ctrl-Alt-Down": "scrollLineDown",
//   "Shift-Cmd-Enter": "Insert line before",
//   "Shift-Cmd-Space": "Select Scope",
//   Esc: "singleSelectionTop",
//   "Alt-Q": "wrapLines",
//   F9: "sortLines",
//   "Cmd-F9": "sortLinesInsensitive",
//   F2: "nextBookmark",
//   "Shift-F2": "prevBookmark",
//   "Cmd-F2": "toggleBookmark",
//   "Shift-Cmd-F2": "clearBookmarks",
//   "Alt-F2": "selectBookmarks"
// };

const KeyBindings = ({ onHide, show }: { onHide: Function, show: boolean }) => (
  <Modal
    dialogClassName="modal-wide"
    centered
    backdrop
    onHide={onHide}
    show={show}
  >
    <Modal.Header closeButton>
      <Modal.Title>Keyboard Shortcuts</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Table striped borderless hover responsive size="sm">
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {_.map(SHORTCUTS, (v, k) => (
            <tr key={k}>
              <td>
                <code>{k}</code>
              </td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={onHide}>Close</Button>
    </Modal.Footer>
  </Modal>
);

export default KeyBindings;
