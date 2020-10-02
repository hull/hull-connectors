// @flow

import React from "react";
import ComputedAttributeBubble from "../components/computed-attribute-bubble";
import Badge from "react-bootstrap/Badge";

const getConfig = () => ({
  // automaticRearrangeAfterDropNode: true,
  collapsible: false,
  directed: true,
  focusAnimationDuration: 0.75,
  height: 300,
  width: window.innerWidth - 373,
  highlightDegree: 1,
  highlightOpacity: 0.5,
  nodeHighlightBehavior: true,
  linkHighlightBehavior: false,
  focusZoom: 1,
  maxZoom: 1,
  minZoom: 1,
  initialZoom: 1,
  panAndZoom: false,
  staticGraph: false,
  staticGraphWithDragAndDrop: false,
  d3: {
    alphaTarget: 0.05,
    gravity: -200,
    linkLength: 100,
    linkStrength: 1
  },
  node: {
    color: "#4c545f",
    fontColor: "white",
    fontSize: 16,
    fontWeight: "normal",
    highlightColor: "white",
    highlightFontSize: 16,
    highlightFontWeight: "normal",
    mouseCursor: "pointer",
    labelPosition: "right",
    renderLabel: true,
    opacity: 1,
    // size: {
    //   width: 2500,
    //   height: 1000
    // },
    strokeColor: "white",
    strokeWidth: 2,
    labelProperty: ({ id, value }) => `${id}: ${JSON.stringify(value)}`
    // viewGenerator: ({ id }) => {
    //   // console.log(argum);
    //   return (
    //     <ComputedAttributeBubble variant="primary">
    //       {id}
    //     </ComputedAttributeBubble>
    //   );
    // }
  },
  link: {
    type: "STRAIGHT",
    color: "#2684FF",
    fontColor: "white",
    fontSize: 12,
    fontWeight: "normal",
    highlightColor: "SAME",
    highlightFontSize: 12,
    highlightFontWeight: "normal",
    labelProperty: "label",
    mouseCursor: "pointer",
    opacity: 1,
    renderLabel: false,
    semanticStrokeWidth: false,
    strokeWidth: 1.5,
    markerHeight: 6,
    markerWidth: 6
  }
});
export default getConfig;
