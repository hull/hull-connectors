import _ from "lodash";
import { isInSegments, getDomain } from "./utils";

/**
 * Check if we should fetch similar companies from clearbit (based on user data and ship configuration)
 * @param  {Message({ user, segments })} message - A user:update message
 * @return {Boolean}
 */
export function shouldDiscover(settings = {}, message = {}) {
  const { discover_account_segments = [] } = settings;
  const { account, account_segments = [] } = message;

  const domain = getDomain(account, null, this.settings.lookup_domain);

  if (_.isEmpty(discover_account_segments)) {
    return { should: false, message: "No segments defined in Discover" };
  }

  if (!domain) {
    return {
      should: false,
      message: "No 'domain' in Account. We need a domain to discover"
    };
  }

  if (account["clearbit/discovered_similar_companies_at"]) {
    return { should: false, message: "Already discovered similar companies" };
  }

  if (!isInSegments(account_segments, discover_account_segments)) {
    return {
      should: false,
      message: "Account is not in a discoverable segment"
    };
  }

  return { should: true };
}

export function discover(clearbit, message) {
  const { account } = message;
  // TODO -> Support Accounts
  const domain = this.getDomain(account);
  const limit = clearbit.settings.discover_limit_count;
  const query = { similar: domain };

  // Let's not call the Discovery API if we have already done it before...
  // return this.companiesDiscoveredFromDomain(domain).then(({ pagination }) => {
  //   if (pagination && pagination.total > 0) {
  //     this.hull.logger.debug("domain.discover.skip", {
  //       reason: "domain already used for discovery !",
  //       domain
  //     });
  //     return false;
  //   }
  //   return clearbit.client.discover({ query, limit })
  // });
  return clearbit.client.discover({ query, limit });
}

// companiesDiscoveredFromDomain(domain) {
//   // TODO -> Support Accounts
//   const query = {
//     term: { "traits_clearbit/discovered_from_domain.exact": domain }
//   };
//   return this.hull.post("search/user_reports", { query });
// }
//
