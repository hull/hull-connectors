// @flow

import type { HullContext, HullUser, HullAccount } from "hull";
import _ from "lodash";
import type {
  ClearbitPerson,
  ClearbitProspect,
  ClearbitCompany
} from "../types";
import { getUserTraitsFrom } from "../clearbit/mapping";
import { /* getDomain, */ now } from "../clearbit/utils";

/**
 * Create a new user on Hull from a discovered Prospect
 * @param  {Object({ person })} payload - Clearbit/Person object
 * @return {Promise -> Object({ person })}
 */
export async function saveProspect(
  ctx: HullContext,
  {
    account = {},
    person = {}
  }: {
    account: HullAccount,
    person: ClearbitProspect
  }
) {
  const { client, metric } = ctx;
  const traits = getUserTraitsFrom(person, "Prospect");

  const attribution = {
    "clearbit/prospected_at": { operation: "setIfNull", value: now() },
    "clearbit/source": { operation: "setIfNull", value: "prospector" }
  };

  const { id, email } = person;
  // as a new user
  const asUser = client.asUser({
    email,
    anonymous_id: `clearbit-prospect:${id}`
  });

  metric.increment("ship.incoming.users", 1, ["prospect"]);

  asUser.logger.info("incoming.user.success", {
    personId: id,
    source: "prospector"
  });

  asUser.traits({ ...traits, ...attribution });

  // as the existing account
  const domain = account.domain || traits["clearbit/domain"];

  const accountScope = _.isEmpty(account)
    ? asUser.account({ domain })
    : client.asAccount({ ...account, domain });

  accountScope.logger.info("incoming.account.success", {
    person,
    source: "prospector"
  });

  await accountScope.traits({
    ...attribution,
    domain: { operation: "setIfNull", value: traits["clearbit/domain"] }
  });
  return person;
}

export async function saveAccount(
  ctx: HullContext,
  {
    account,
    company,
    user,
    source
  }: {
    account: HullAccount,
    user: HullUser,
    company: ClearbitCompany,
    source: "prospect" | "enrich" | "discover" | "reveal"
  },
  meta?: {} = {}
) {
  const { client, metric, connector } = ctx;
  const { private_settings } = connector;
  const { incoming_company_mapping } = private_settings;

  const traits = {
    domain: { value: company.domain, operation: "setIfNull" },
    name: { value: company.name, operation: "setIfNull" },
    "clearbit/id": company.id,
    "clearbit/fetched_at": { value: now(), operation: "setIfNull" },
    ...(source
      ? {
          "clearbit/source": { value: source, operation: "setIfNull" },
          [`clearbit/${source}ed_at`]: { value: now(), operation: "setIfNull" }
        }
      : {})
  };
  _.forEach(incoming_company_mapping, ({ hull, service, overwrite }) => {
    const value = _.get(company, service);
    traits[hull] = overwrite ? value : { value, operation: "setIfNull" };
  });

  const domain = account.domain || traits.domain;

  const accountClaims = { domain, anonymous_id: `clearbit:${company.id}` };
  const asAccount = _.isEmpty(account)
    ? client.asUser(user).account(accountClaims)
    : client.asAccount({
        ...account,
        ...accountClaims
      });

  asAccount.logger.info("incoming.account.success", {
    source,
    traits
  });

  metric.increment("ship.incoming.accounts", 1, ["saveAccount"]);

  await asAccount.traits(traits);

  asAccount.logger.info("incoming.account.success", {
    ...meta,
    source,
    traits
  });
  return company;
}

export async function saveUser(
  ctx: HullContext,
  {
    // account,
    user,

    // company,
    person,

    source
  }: {
    // account: HullAccount,
    user: HullUser,
    person?: ClearbitPerson,
    // company: ClearbitCompany,
    source: "prospect" | "enrich" | "discover" | "reveal"
  },
  meta?: {} = {}
) {
  const { client, metric, connector } = ctx;
  const { private_settings } = connector;
  const { incoming_person_mapping } = private_settings;
  // Never ever change the email address (Clearbit strips +xxx parts, so we end up with complete
  // messed up ident claims if we do this). We need to pass all claims
  // to the platform to allow proper identity resolution.

  if (!person) {
    return;
  }

  // const ident = _.pick(user, ["id", "external_id", "email"]);
  // if (!ident || !_.size(ident)) {
  //   throw new Error("Missing identifier for user");
  // }

  const asUser = client.asUser({
    ...user,
    anonymous_id: `clearbit:${person.id}`
  });

  const traits = {
    id: { value: person.id, operation: "setIfNull" },
    email: { value: person.email, operation: "setIfNull" },
    picture: { value: person.avatar, operation: "setIfNull" },
    first_name: { value: person.name.givenName, operation: "setIfNull" },
    last_name: { value: person.name.familyName, operation: "setIfNull" },
    address_city: { value: person.geo.city, operation: "setIfNull" },
    address_state: { value: person.geo.state, operation: "setIfNull" },
    "clearbit/id": person.id,
    "clearbit/fetched_at": { value: now(), operation: "setIfNull" },
    ...(source
      ? {
          "clearbit/source": { value: source, operation: "setIfNull" },
          [`clearbit/${source}ed_at`]: { value: now(), operation: "setIfNull" }
        }
      : {})
  };
  _.forEach(incoming_person_mapping, ({ hull, service, overwrite }) => {
    const value = _.get(person, service);
    traits[hull] = overwrite ? value : { value, operation: "setIfNull" };
  });

  // const traits = {
  //   ...getUserTraitsFrom(person, "Person"),
  //   "clearbit/fetched_at": { value: now(), operation: "setIfNull" }
  //   // Don't save "clearbit_company" traits anymore at the user level - only account level
  //   // ...getUserTraitsFrom(company, "PersonCompany"),
  // };

  metric.increment("ship.incoming.users", 1, ["saveUser"]);

  await asUser.traits(traits);
  asUser.logger.info("incoming.user.success", { ...meta, source, traits });
  return { traits, user, person };
}

// export async function saveDiscovered(
//   ctx: HullContext,
//   {
//     domain,
//     companies
//   }: {
//     domain: string,
//     companies: Array<ClearbitCompany>
//   }
// ) {
//   const { client } = ctx;
//   await Promise.all(
//     companies.map(async company => {
//       const traits = getAccountTraitsFromCompany(company);
//       await client
//         .asAccount({
//           anonymous_id: `clearbit-company:${company.id}`,
//           domain: traits.domain
//         })
//         .traits({
//           ...traits,
//           "clearbit/discovered_from_domain": {
//             value: domain,
//             operation: "setIfNull"
//           },
//           "clearbit/discovered_at": {
//             value: now(),
//             operation: "setIfNull"
//           },
//           "clearbit/source": {
//             value: "discover",
//             operation: "setIfNull"
//           }
//         });
//       return company;
//     })
//   );
// }
