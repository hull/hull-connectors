// @flow

const { Client } = require("hull");
const superagent = require("superagent");
const fs = require("fs");
const _ = require("lodash");

const ships = [
  {
    ship: "",
    secret: "",
    organization: ""
  }
];
const parentDirectory = "/Users/hubspot";
(async () => {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i];
    const hullClient = new Client({
      id: ship.ship,
      secret: ship.secret,
      organization: ship.organization
    });

    const fileName = `${ship.ship}.${ship.organization}.json`;

    console.log("--------------------------------------------------");
    try {
      const buf = fs.readFileSync(
        `${parentDirectory}/Backup/${fileName}`,
        "utf8"
      );

      hullClient.get("app").then(async connector => {
        const privateSettings = _.cloneDeep(connector.private_settings);

        const oldPrivateSettings = JSON.parse(buf);

        privateSettings.incoming_user_attributes =
          oldPrivateSettings.incoming_user_attributes || [];
        privateSettings.outgoing_user_attributes =
          oldPrivateSettings.outgoing_user_attributes || [];
        privateSettings.outgoing_account_attributes =
          oldPrivateSettings.outgoing_account_attributes || [];
        privateSettings.incoming_account_attributes =
          oldPrivateSettings.incoming_account_attributes || [];
        // eslint-disable-next-line no-await-in-loop
        await hullClient.utils.settings.update(oldPrivateSettings);
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
      });
    } catch (err) {
      console.error(
        "ERROR",
        `ship: ${ship.ship}`,
        `org: ${ship.organization}`,
        `message: ${err.message}`
      );
    }
  }
  console.log("--------------------------------------------------");
  console.log("DONE");
})();
