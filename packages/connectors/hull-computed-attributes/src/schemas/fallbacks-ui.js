import FallbackFieldTemplate from "../templates/fallback-field";
import SourceFieldTemplate from "../templates/source-field";

const sourceAttribute = {
  classNames: "field_source_property",
  "ui:field": "SourceAttributeField",
  "ui:label": false,
  "ui:placeholder": "Attribute to read from"
};

const fallbacksUiSchema = {
  "ui:options": {
    orderable: false
  },
  items: {
    "ui:ObjectFieldTemplate": FallbackFieldTemplate,
    classNames: "field_fallback",
    target: {
      classNames: "field_target",
      "ui:label": false,
      "ui:placeholder": "Target Attribute"
    },
    operation: {
      classNames: "field_operation"
    },
    sources: {
      classNames: "field_sources",
      items: {
        classNames: "field_source",
        "ui:ObjectFieldTemplate": SourceFieldTemplate,
        "ui:label": false,
        property: sourceAttribute,
        mapper: {
          property: sourceAttribute,
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
    }
  }
};

export default fallbacksUiSchema;
