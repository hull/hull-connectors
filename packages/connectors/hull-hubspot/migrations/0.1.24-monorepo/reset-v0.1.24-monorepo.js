// @flow

const { Client } = require("hull");
const superagent = require("superagent");
const fs = require("fs");

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

    const fileName = `${ship.organization}.json`;

    console.log("--------------------------------------------------");
    // eslint-disable-next-line no-await-in-loop
    const buf = fs.readFileSync(
      `${parentDirectory}/Backup/${fileName}`,
      "utf8"
    );

    const oldPrivateSettings = JSON.parse(buf);
    // eslint-disable-next-line no-await-in-loop
    await hullClient.utils.settings.update(oldPrivateSettings);
    console.log("Updated Settings Org:", `${ship.organization}`);
    // eslint-disable-next-line no-await-in-loop
    await superagent
      .agent()
      .post(`https://${ship.organization}/api/v1/${ship.ship}/update_manifest`)
      .set("Hull-App-Id", ship.ship)
      .set("Hull-Access-Token", ship.secret)
      .then(updateManifestRes => {
        console.log(
          "Refresh Manifest:",
          `org: ${ship.organization}`,
          `status: ${updateManifestRes.status}`
        );
      });
  }
  console.log("--------------------------------------------------");
  console.log("DONE");
})();
