const contactMetaGroup = {
  name: "contactmeta",
  displayName: "Contact Meta",
  properties: [
    {
      name: "contact_meta.merged-vids",
      label: "Merged Vids",
      type: "string",
      fieldType: "text",
      readOnlyValue: true
    }
  ]
};

module.exports = {
  contactMetaGroup
};
