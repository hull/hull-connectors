import ComptuedAttributesField from "../templates/computed-attributes-field";
// import SourceFieldTemplate from "../templates/source-field";

const sourceAttribute = {
  classNames: "field_attribute",
  "ui:field": "AttributeField",
  "ui:label": false,
  "ui:placeholder": "Attribute to read from"
};

const computedAttributesUiSchema = {
  "ui:options": {
    orderable: false
  },
  items: {
    "ui:ObjectFieldTemplate": ComptuedAttributesField,
    classNames: "field_computed_attrobute",
    computed_attribute: {
      classNames: "field_computed_attribute_name",
      "ui:label": false,
      "ui:placeholder": "Computed Attribute Name"
    },
    strategy: {
      classNames: "field_strategy"
    },
    operation: {
      classNames: "field_operation"
    },
    type: {
      classNames: "field_type"
    },
    params: {
      attribute: sourceAttribute,
      mapping: {
        classNames: "field_mappings",
        items: {
          classNames: "field_mapping",
          source: {
            classNames: "field_mapping_source",
            "ui:placeholder": "Original Value",
            "ui:label": false
          },
          destination: {
            classNames: "field_mapping_destination",
            "ui:placeholder": "Remapped Value",
            "ui:label": false
          }
        }
      },
      value: {
        classNames: "field_source_value",
        "ui:placeholder": "Static Value (i.e. 1234)",
        "ui:label": false
      }
    }
  }
};

export default computedAttributesUiSchema;
