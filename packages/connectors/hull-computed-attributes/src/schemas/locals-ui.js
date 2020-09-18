import LocalsFieldTemplate from "../templates/locals-field";

const localsUiSchema = {
  "ui:options": {
    orderable: false
  },
  items: {
    "ui:ObjectFieldTemplate": LocalsFieldTemplate,
    classNames: "field_locals",
    target: {
      "ui:label": false,
      "ui:placeholder": "Variable Name",
      classNames: "field_locals_target",
      pattern: "^[/a-zA-Z_\\-0-9]+$"
    },
    source: {
      "ui:label": false,
      "ui:placeholder": "Expression to compute",
      classNames: "field_locals_source"
    }
  }
};
export default localsUiSchema;
