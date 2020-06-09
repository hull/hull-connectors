// @flow
/* eslint-disable jsx-a11y/accessible-emoji */
import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";

type Props = {
  content: any,
  show: any,
  onHide: Function,
  title?: string | React$Node,
  body?: string | React$Node,
  footer?: string | React$Node,
  actions?: string | React$Node
};
export default class ConfigurationModal extends Component<Props> {
  node = null;

  render() {
    const { content, footer, show, actions, onHide, title, body } = this.props;
    return (
      <Modal centered size="lg" onHide={onHide} show={show}>
        <Modal.Body>
          <div className="ps-2">
            <div>
              {title && (
                <>
                  <h3 className="mt-1 mb-0 text-center">{title}</h3>
                  <h1 className="mt-0 mb-0 text-center">🤓</h1>
                </>
              )}
              {content}
            </div>
            {body && <div style={{ marginBottom: "1rem" }}>{body}</div>}
            {footer && <div className="mb-1">{footer}</div>}
          </div>
        </Modal.Body>
        {actions && <Modal.Footer>{actions}</Modal.Footer>}
      </Modal>
    );
  }
}
