/* @flow */

const _ = require("lodash");
const Promise = require("bluebird");

function saveContactObject({ privateSettings, syncAgent, record, resourceSchema }: Object): Promise<*> {
  const hullClient = syncAgent.hullClient;
  const attributesMapper = syncAgent.attributesMapper;

  const traits = attributesMapper.mapToHullAttributeObject("Contact", record, resourceSchema);
  const userIdentity = attributesMapper.mapToHullIdentObject("Contact", record);
  const asContactUser = hullClient.asUser(userIdentity);
  const promises = [];

  const accountClaims = _.get(privateSettings, "account_claims", []);
  const requireEmail = _.get(privateSettings, "ignore_users_withoutemail", false);
  const fetchAccounts = _.get(privateSettings, "fetch_accounts", false);
  const linkAccounts = _.get(privateSettings, "link_accounts", false);

  if (_.get(record, "Email", "n/a") === "n/a" && requireEmail) {
    return asContactUser.logger.info("incoming.user.skip", { type: "Contact", reason: "User has no email address and is not identifiable." });
  }
  promises.push(asContactUser
    .traits(traits)
    .then(() => {
      asContactUser.logger.info("incoming.user.success", { traits });
    })
    .catch((error) => {
      asContactUser.logger.error("incoming.user.error", { error });
    }));

  // Link with this contact's account
  // Right now account linking does not seem to work because in mapToHullIdentObject pulls the account id from record.Account.Id
  // but in getSoqlFields in service-client for Contacts, we do not add Account.Id by default to the incoming fields
  // so we end up with a lot of salesforce:undefined ids seems like
  // only saving grace might be the linkAccounts is not enabled by default
  // and even when it is labeled, the this.identMapping.Account.service must be present
  // which then creates a separate account with a separate "key" which is usually domain
  if (linkAccounts && fetchAccounts && record.Account && accountClaims.length > 0 && !_.isNil(_.get(record.Account, accountClaims[0].service))) {
    hullClient.logger.debug("incoming.account.link", {
      user: attributesMapper.mapToHullIdentObject("Contact", record),
      account: attributesMapper.mapToHullIdentObject("Account", record.Account)
    });
    const accountIdentity = attributesMapper.mapToHullIdentObject("Account", record.Account);
    promises.push(hullClient
      .asUser(userIdentity)
      .account(accountIdentity)
      .traits({})
      .then(() => {
        asContactUser.logger.info("incoming.account.link.success");
      })
      .catch((error) => {
        asContactUser.logger.error("incoming.account.link.error", { error });
      }));
  }

  return Promise.all(promises);
}

module.exports = {
  saveContactObject
};
