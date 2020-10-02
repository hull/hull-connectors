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
  highlightDegree: 2,
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
    alphaTarget: 0.5,
    gravity: -300,
    linkLength: 20,
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
    labelPosition: "bottom",
    renderLabel: true,
    opacity: 1,
    // size: {
    //   width: 2500,
    //   height: 1000
    // },
    strokeColor: "#FFFFFFCC",
    strokeWidth: 2,
    // labelProperty: ({ id, value }) => `${id}: ${JSON.stringify(value)}`
    labelProperty: ({ id, value }) => id
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
    color: "#999",
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
