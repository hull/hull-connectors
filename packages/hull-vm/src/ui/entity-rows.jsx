// @noflow
import React, { Component } from "react";
import EntityRow from "./entity-row";
import ListGroup from "react-bootstrap/ListGroup";

const isUser = entity => entity === "user";
const getEntity = (entity, data) => (isUser(entity) ? data.user : data.account) || {};

export default class EntityRows extends Component {
  handleClick = e => {
    this.props.onClick && this.props.onClick(e.target.value);
  };

  render() {
    const { selectedIndex, entity, data } = this.props;
    const ent = getEntity(entity, data);
    const title = ent.name;
    const subtitle = (isUser(entity) ? data.email : data.domain) || "unknown";
    return (
      <ListGroup style={{ overflow: "scroll" }}>
        {data.map((d, i) => (
          <ListGroup.Item
            value={i}
            key={i}
            as="li"
            active={i === selectedIndex}
            onClick={this.handleClick}
          >
            <EntityRow title={title} subtitle={subtitle} />
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  }
}
