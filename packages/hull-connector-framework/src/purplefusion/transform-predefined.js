const { isUndefinedOrNull } = require("./utils");
const { varEqual, not, isServiceAttributeInVarList, varNull, varUndefinedOrNull } = require("./conditionals");

function createIncomingServiceUserTransform(entityType) {
  return {
    target: { component: "new" },
    then: serviceUserTransforms(entityType)
  };
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
      operateOn: `\${connector.private_settings.${attributeName}_claims}`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: { component: "input", select: "${mapping.service}", name: "serviceValue" },
        condition: not(varEqual("serviceValue", undefined)),
        writeTo: {
          // should expose specific identity mappings like "primaryEmail" if there are service specific rules/attributes...
          path: "ident.${mapping.hull}"
        }
      }
    },
    {
      operateOn: `\${connector.private_settings.incoming_${attributeName}_attributes}`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: { component: "input", select: "${mapping.service}", name: "serviceValue" },
        condition: not(varEqual("serviceValue", undefined)),
        then: [
          {
            condition: varEqual("mapping.overwrite", false),
            writeTo: { path: "attributes.${mapping.hull}", format: { operation: "setIfNull", value: "${operateOn}" } }
          },
          {
            condition: varEqual("mapping.overwrite", true),
            writeTo: { path: "attributes.${mapping.hull}", format: { operation: "set", value: "${operateOn}" } }
          }
        ]
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
              value: "${operateOn}",
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
      operateOn: { component: "input", select: "name" },
      condition: not(varUndefinedOrNull("operateOn")),
      writeTo: { path: "attributes.name", format: { operation: "setIfNull", value: "${operateOn}" } }
    },
    {
      condition: varEqual(`connector.private_settings.link_${attributeName}_in_hull`, true),
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

function createEnumTransform({ attribute, attributeId, route, forceRoute }) {
  const onUndefined = forceRoute ? { component: "glue", route: forceRoute, select: "${attributeId}" } : undefined;

  return {
    then: [
      {
        operateOn: {
          component: "glue",
          route: route,
          select: { component: "input", select: attributeId, name: "attributeId" },
          onUndefined
        },
        // default null?
        writeTo: attribute
      },
      {
        operateOn: { component: "input", select: attributeId },
        condition: varNull("operateOn"),
        writeTo: attribute
      }
    ]
  };
}

function createEnumTransformWithAttributeList({ attribute, attributeId, attributeList, route, forceRoute }) {
  return {
    condition: isServiceAttributeInVarList(attribute, attributeList),
    then: createEnumTransform({ attribute, attributeId, route, forceRoute })
  }
}

function createEnumTransformOutgoing({ attribute, writePath, attributeList, route, forceRoute, format, formatOnNull }) {
  const onUndefined = forceRoute ? { component: "glue", route: forceRoute, select: "${attributeValue}", onUndefined: null} : undefined;

  return {
    operateOn: { component: "settings", select: [attributeList, { service: attribute }, "[0]", "hull" ], name: "attributeId" },
    condition: not(varEqual("attributeId", undefined)),
    then:{
      operateOn: { component: "context", select: "message.user.${attributeId}", name: "attributeValue", onUndefined: null },
      then: [
        {
          operateOn: {
            component: "glue",
            route: route,
            select: "${attributeValue}",
            onUndefined
          },
          // default null?
          writeTo: {
            path: writePath,
            format
          }
        },
        {
          condition: varNull("operateOn"),
          writeTo: {
            path: writePath,
            format: formatOnNull
          }
        }
      ]
    }
  };
}

function createEnumTransformWithAttributeListOutgoing({
    attribute,
    attributeList,
    route,
    forceRoute,
    format,
    formatOnNull,
    writePath
}) {
  return {
    condition: isServiceAttributeInVarList(attribute, attributeList),
    then: createEnumTransformOutgoing({ attribute, attributeList, route, forceRoute, format, formatOnNull, writePath })
  }
}


module.exports = {
  createEnumTransformWithAttributeListOutgoing,
  createIncomingServiceUserTransform,
  createEnumTransformWithAttributeList,
  createEnumTransform
};
