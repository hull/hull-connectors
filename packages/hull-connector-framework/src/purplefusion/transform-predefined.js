const { isUndefinedOrNull } = require("./utils");
const { isEqual } = require("./conditionals");

function createIncomingServiceUserTransform(entityType) {
  return [
    {
      target: { component: "new" },
      then: serviceUserTransforms(entityType)
    }
  ]
}

function serviceUserTransforms(entityType) {
  let anonymousIdPostFix = "";
  let anonymousIdPrefix = "";
  let anonymousIdAttributePostfix = "";
  let attributeName = "user";

  if (!isUndefinedOrNull(entityType)) {
    anonymousIdPostFix = `-${entityType}`;
    anonymousIdPrefix = `${entityType}-`;
    anonymousIdAttributePostfix = `_${entityType}`;
    attributeName = entityType;
  }
  return [
    {
      operateOn: `connector.private_settings.${attributeName}_claims`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: { component: "input", select: "${mapping.service}"},
        writeTo: {
          // should expose specific identity mappings like "primaryEmail" if there are service specific rules/attributes...
          path: "ident.${mapping.hull}"
        }
      }
    },
    {
      operateOn: `connector.private_settings.incoming_${attributeName}_attributes`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: { component: "input", select: "${mapping.service}"},
        writeTo: {
          path: "attributes.${mapping.hull}"
        }
      }
    },
    {
      operateOn: { component: "input", select: "id" },
      then:[
        { writeTo: { path: "ident.anonymous_id", format: `\${service_name}${anonymousIdPostFix}:${anonymousIdPrefix}\${operateOn}` } },
        {
          writeTo: {
            path: `attributes.\${service_name}${anonymousIdAttributePostfix}/id`,
            format: {
              value: "${value}",
              operation: "set"
            }
          }
        }
      ]
    },
    {
      operateOn: { component: "input", select: "hull_multiple_anonymous_ids" },
      writeTo: { path: "ident.anonymous_ids" }
    },
    {
      condition: isEqual("connector.private_settings.link_users_in_hull", true),
      then: [
        {
          operateOn: { component: "input", select: "hull_service_accountId" },
          writeTo: { path: "accountIdent.anonymous_id", format: "${service_name}:${operateOn}" }
        },
        {
          operateOn: { component: "input", select: "hull_service_accountId" },
          writeTo: { path: "accountAttributes.${service_name}/id" }
        }
      ]
    }
  ];
}

module.exports = {
  createIncomingServiceUserTransform
};
