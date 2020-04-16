// @flow

const _ = require("lodash");
const { Client } = require("hull");
const { superagentUrlTemplatePlugin } = require("hull/src/utils");
const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const fs = require("fs");
const { defaultAccountAttributes } = require("./default-account-attributes");
const { defaultContactAttributes } = require("./default-contact-attributes");

const ships = [
  {
    ship: "",
    secret: "",
    organization: ""
  }
];

function isAttributeHullManaged(hubspotProperties, attributeName) {
  const hubspotContactProperty = _.find(hubspotProperties, {
    name: attributeName
  });

  const hullManagedContactProperty = _.find(hubspotProperties, {
    name: `hull_${attributeName}`
  });

  return (
    _.isNil(hubspotContactProperty) ||
    (!_.isNil(hullManagedContactProperty) &&
      hullManagedContactProperty.groupName === "hull")
  );
}

function transformIncomingClaims(incoming_claims) {
  const original_claims = _.cloneDeep(incoming_claims);

  // leave claims alone
  return original_claims;
}
function transformIncomingAttributes(
  entity,
  incoming_attributes,
  defaultAttributeMapping,
  hubspotProperties
) {
  const custom_attributes = [];
  const new_attributes = _.cloneDeep(incoming_attributes).map(attr => {
    const hubspotProperty = _.find(hubspotProperties, property => {
      return property.name === attr.service;
    });
    const type = _.isNil(hubspotProperty) ? "" : hubspotProperty.type;
    const fieldType = _.isNil(hubspotProperty) ? "" : hubspotProperty.fieldType;
    if (type === "enumeration" && fieldType === "checkbox") {
      return {
        service: `properties.${attr.service}.value.$split(';')`,
        hull: attr.hull,
        overwrite: true
      };
    }

    return {
      service: `properties.${attr.service}.value`,
      hull: attr.hull,
      overwrite: true
    };
  });

  if (entity === "user") {
    _.remove(new_attributes, attr => attr.service === "properties.email.value");
    custom_attributes.push({
      service: "`canonical-vid` ? `canonical-vid` : `vid`",
      hull: "traits_hubspot/id",
      readOnly: true,
      overwrite: true
    });
    custom_attributes.push({
      service: "properties.email.value",
      hull: "traits_hubspot/email",
      readOnly: true,
      overwrite: true
    });

    const existingMergedVidMapping = _.remove(
      new_attributes,
      attr => attr.service === "properties.contact_meta.merged-vids.value"
    );
    if (!_.isEmpty(existingMergedVidMapping)) {
      custom_attributes.push({
        service: "`merged-vids`",
        hull: existingMergedVidMapping[0].hull,
        overwrite: true
      });
    }
  }

  if (entity === "account") {
    _.remove(
      new_attributes,
      attr => attr.service === "properties.domain.value"
    );
    custom_attributes.push({
      service: "companyId",
      hull: "hubspot/id",
      readOnly: true,
      overwrite: true
    });

    custom_attributes.push({
      service: "properties.domain.value",
      hull: "hubspot/domain",
      readOnly: true,
      overwrite: true
    });
  }

  _.remove(
    new_attributes,
    attr => attr.service === "properties.hs_object_id.value"
  );

  _.forEach(defaultAttributeMapping, defaultMapping => {
    const existingAttribute = _.find(
      new_attributes,
      attr => attr.service === defaultMapping.service
    );

    if (_.isNil(existingAttribute)) {
      new_attributes.push({
        service: defaultMapping.service,
        hull: defaultMapping.hull,
        overwrite: true
      });
    }
  });

  return [...custom_attributes, ...new_attributes];
}

async function transformOutgoingAttributes(
  entity,
  outgoing_attributes,
  hubspotProperties
) {
  const custom_attributes = [];
  const new_attributes = _.cloneDeep(outgoing_attributes).map(attr => {
    const isHullManaged = isAttributeHullManaged(
      hubspotProperties,
      attr.service
    );

    const serviceAttr = isHullManaged ? `hull_${attr.service}` : attr.service;

    return {
      service: serviceAttr,
      hull: attr.hull,
      overwrite: true
    };
  });

  if (entity === "user") {
    custom_attributes.push({
      service: "hull_segments",
      hull: "segments.name[]",
      readOnly: true,
      overwrite: true
    });
  }

  if (entity === "account") {
    custom_attributes.push({
      service: "hull_segments",
      hull: "account_segments.name[]",
      readOnly: true,
      overwrite: true
    });
  }
  return [...custom_attributes, ...new_attributes];
}

let new_incoming_user_claims;
let new_incoming_account_claims;
let new_incoming_user_attributes;
let new_incoming_account_attributes;
let new_outgoing_user_attributes;
let new_outgoing_account_attributes;

async function getContactPropertyGroups(hubspotAgent) {
  return hubspotAgent
    .get("/contacts/v2/groups")
    .query({
      includeProperties: true
    })
    .then(response => response.body);
}

async function getCompanyPropertyGroups(hubspotAgent) {
  return hubspotAgent
    .get("/properties/v1/companies/groups")
    .query({
      includeProperties: true
    })
    .then(response => response.body);
}
const parentDirectory = "/Users/hubspot";
(async () => {
  const backupDirectory = `${parentDirectory}/Backup`;
  if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory);
  }
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i];
    const hullClient = new Client({
      id: ship.ship,
      secret: ship.secret,
      organization: ship.organization
    });

    const fileName = `${ship.organization}.json`;

    // eslint-disable-next-line no-await-in-loop,no-loop-func
    const connector = await hullClient.get("app");
    console.log("--------------------------------------------------");
    const private_settings = _.cloneDeep(connector.private_settings);

    if (!fs.existsSync(`${parentDirectory}/${ship.organization}`)) {
      fs.mkdirSync(`${parentDirectory}/${ship.organization}`);
    }

    // eslint-disable-next-line no-await-in-loop
    await fs.promises.writeFile(
      `${parentDirectory}/${ship.organization}/old_${fileName}`,
      JSON.stringify(private_settings, null, 4),
      err => {
        if (err) throw err;
      }
    );

    // eslint-disable-next-line no-await-in-loop
    await fs.promises.writeFile(
      `${parentDirectory}/Backup/${fileName}`,
      JSON.stringify(private_settings, null, 4),
      err => {
        if (err) throw err;
      }
    );

    const {
      incoming_user_claims = [],
      incoming_account_claims = [],
      incoming_user_attributes = [],
      outgoing_user_attributes = [],
      token
    } = private_settings;

    const outgoing_account_attributes = (
      private_settings.outgoing_account_attributes || []
    ).map(entry => {
      return {
        hull: entry.hull,
        service: entry.service || entry.hubspot
      };
    });
    const incoming_account_attributes = (
      private_settings.incoming_account_attributes || []
    ).map(entry => {
      return {
        hull: entry.hull,
        service: entry.service || entry.hubspot
      };
    });

    try {
      const hubspotAgent = superagent
        .agent()
        .use(superagentUrlTemplatePlugin({}))
        .use(prefixPlugin("https://api.hubapi.com"))
        .set("Authorization", `Bearer ${token}`)
        .timeout({
          response: 10000
        });

      // eslint-disable-next-line no-await-in-loop
      const hubspotContactGroups = await getContactPropertyGroups(hubspotAgent);
      // eslint-disable-next-line no-await-in-loop
      const hubspotCompanyGroups = await getCompanyPropertyGroups(hubspotAgent);

      const hubspotContactProperties = _.flatten(
        hubspotContactGroups.map(group => group.properties)
      );
      const hubspotCompanyProperties = _.flatten(
        hubspotCompanyGroups.map(group => group.properties)
      );

      new_incoming_user_claims = transformIncomingClaims(incoming_user_claims);
      new_incoming_account_claims = transformIncomingClaims(
        incoming_account_claims
      );

      new_incoming_user_attributes = transformIncomingAttributes(
        "user",
        incoming_user_attributes,
        defaultContactAttributes,
        hubspotContactProperties
      );
      new_incoming_account_attributes = transformIncomingAttributes(
        "account",
        incoming_account_attributes,
        defaultAccountAttributes,
        hubspotCompanyProperties
      );
      // eslint-disable-next-line no-await-in-loop
      new_outgoing_user_attributes = await transformOutgoingAttributes(
        "user",
        outgoing_user_attributes,
        hubspotContactProperties
      );
      // eslint-disable-next-line no-await-in-loop
      new_outgoing_account_attributes = await transformOutgoingAttributes(
        "account",
        outgoing_account_attributes,
        hubspotCompanyProperties
      );

      const newPrivateSettings = {
        ...private_settings,
        incoming_user_claims: new_incoming_user_claims,
        incoming_user_attributes: new_incoming_user_attributes,
        outgoing_user_attributes: new_outgoing_user_attributes,
        incoming_account_claims: new_incoming_account_claims,
        incoming_account_attributes: new_incoming_account_attributes,
        outgoing_account_attributes: new_outgoing_account_attributes,
        sync_fields_to_hull: undefined,
        sync_fields_to_hubspot: undefined,
        incoming_account_ident_service: undefined,
        incoming_account_ident_hull: undefined,
        synchronized_segments: undefined
      };

      // eslint-disable-next-line no-await-in-loop
      await fs.promises.writeFile(
        `${parentDirectory}/${ship.organization}/new_${fileName}`,
        JSON.stringify(newPrivateSettings, null, 4),
        err => {
          if (err) throw err;
        }
      );

      // eslint-disable-next-line no-await-in-loop
      await hullClient.utils.settings.update(newPrivateSettings);
      console.log("Updated Settings Org:", `${ship.organization}`);
      // eslint-disable-next-line no-await-in-loop
      await superagent
        .agent()
        .post(
          `https://${ship.organization}/api/v1/${ship.ship}/update_manifest`
        )
        .set("Hull-App-Id", ship.ship)
        .set("Hull-Access-Token", ship.secret)
        .then(updateManifestRes => {
          console.log(
            "Refresh Manifest:",
            `org: ${ship.organization}`,
            `status: ${updateManifestRes.status}`
          );
        });
    } catch (error) {
      const { status, message } = error;

      console.error(
        "ERROR",
        `ship: ${ship.ship}`,
        `org: ${ship.organization}`,
        `status: ${status}`,
        `message: ${message}`
      );
    }
  }
})();
