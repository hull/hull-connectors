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
  defaultAttributeMapping
) {
  const custom_attributes = [];
  const new_attributes = _.cloneDeep(incoming_attributes).map(attr => {
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
    await hullClient.get("app").then(async connector => {
      console.log("--------------------------------------------------");
      const private_settings = _.cloneDeep(connector.private_settings);

      if (!fs.existsSync(`${parentDirectory}/${ship.organization}`)) {
        fs.mkdirSync(`${parentDirectory}/${ship.organization}`);
      }

      await fs.promises.writeFile(
        `${parentDirectory}/${ship.organization}/old_${fileName}`,
        JSON.stringify(private_settings, null, 4),
        err => {
          if (err) throw err;
        }
      );

      await fs.promises.writeFile(
        `${parentDirectory}/Backup/${fileName}`,
        JSON.stringify(private_settings, null, 4),
        err => {
          if (err) throw err;
        }
      );

      let {
        incoming_user_attributes,
        outgoing_user_attributes,
        incoming_account_attributes,
        outgoing_account_attributes,
        synchronized_user_segments
      } = private_settings;

      const {
        synchronized_segments = [],
        sync_fields_to_hull = [],
        sync_fields_to_hubspot = [],
        incoming_user_claims = [],
        incoming_account_claims = [],
        token
      } = private_settings;

      // eslint-disable-next-line
      if (_.isNil(synchronized_user_segments) && !_.isEmpty(synchronized_segments)) {
        synchronized_user_segments = synchronized_segments;
      }

      // eslint-disable-next-line
      if (_.isNil(incoming_user_attributes) && !_.isEmpty(sync_fields_to_hull)) {
        incoming_user_attributes = _.map(sync_fields_to_hull, m => {
          return {
            hull: m.hull,
            service: m.name,
            overwrite: true
          };
        });
      }

      // eslint-disable-next-line
      if (_.isNil(outgoing_user_attributes) && !_.isEmpty(sync_fields_to_hubspot)) {
        outgoing_user_attributes = _.map(sync_fields_to_hubspot, m => {
          return {
            hull: m.hull,
            service: m.name,
            overwrite: true
          };
        });
      }

      outgoing_account_attributes = outgoing_account_attributes.map(entry => {
        return {
          hull: entry.hull,
          service: entry.service || entry.hubspot
        };
      });
      incoming_account_attributes = incoming_account_attributes.map(entry => {
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

        const hubspotContactGroups = await getContactPropertyGroups(
          hubspotAgent
        );
        const hubspotCompanyGroups = await getCompanyPropertyGroups(
          hubspotAgent
        );

        const hubspotContactProperties = _.flatten(
          hubspotContactGroups.map(group => group.properties)
        );

        const hubspotCompanyProperties = _.flatten(
          hubspotCompanyGroups.map(group => group.properties)
        );
        new_incoming_user_claims = transformIncomingClaims(
          incoming_user_claims
        );

        new_incoming_account_claims = transformIncomingClaims(
          incoming_account_claims
        );

        new_incoming_user_attributes = transformIncomingAttributes(
          "user",
          incoming_user_attributes,
          defaultContactAttributes
        );
        new_incoming_account_attributes = transformIncomingAttributes(
          "account",
          incoming_account_attributes,
          defaultAccountAttributes
        );
        new_outgoing_user_attributes = await transformOutgoingAttributes(
          "user",
          outgoing_user_attributes,
          hubspotContactProperties
        );
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
          synchronized_user_segments,
          sync_fields_to_hull: undefined,
          sync_fields_to_hubspot: undefined,
          incoming_account_ident_service: undefined,
          incoming_account_ident_hull: undefined,
          synchronized_segments: undefined
        };

        await fs.promises.writeFile(
          `${parentDirectory}/${ship.organization}/new_${fileName}`,
          JSON.stringify(newPrivateSettings, null, 4),
          err => {
            if (err) throw err;
          }
        );

        return hullClient.utils.settings.update(newPrivateSettings).then(() => {
          console.log("Updated Settings Org:", `${ship.organization}`);
          return superagent
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
      return Promise.resolve();
    });
  }
})();
