// @flow

import type { HullContext, HullUser, HullAccount } from "hull";
import _ from "lodash";
import type {
  ClearbitPerson,
  ClearbitProspect,
  ClearbitCompany
} from "../types";

import { now } from "./utils";

const getClearbitAnonymousId = entity => entity.id && `clearbit:${entity.id}`;

/**
 * Create a new user on Hull from a discovered Prospect
 * @param  {Object({ person })} payload - Clearbit/Person object
 * @return {Promise -> Object({ person })}
 */

export async function saveProspect({
  ctx,
  attribution,
  account,
  prospect = {}
}: {
  ctx: HullContext,
  attribution: { [key: string]: {} },
  account: HullAccount | { domain?: string },
  prospect: ClearbitProspect
}): Promise<any> {
  const { client, metric, helpers } = ctx;
  const { mapAttributes } = helpers;
  const { id, email } = prospect;
  try {
    const traits = mapAttributes({
      entity: prospect,
      mapping: "incoming_prospect_mapping",
      type: "prospect",
      direction: "incoming"
    });

    // as a new user
    const asUser = client.asUser(
      {
        email,
        anonymous_id: `clearbit-prospect:${id}`
      },
      {},
      account
    );

    const accountAttribution = account.id
      ? { "clearbit/prospected_account_id": account.id }
      : {};

    metric.increment("ship.incoming.users", 1, ["prospect"]);
    return asUser.traits({ ...traits, ...attribution, ...accountAttribution });
  } catch (err) {
    console.log("ERROR!-----------------", err);
    return undefined;
  }
}

export async function saveProspects({
  ctx,
  account,
  prospects = []
}: {
  ctx: HullContext,
  account?: HullAccount,
  prospects: Array<{| ...ClearbitProspect, domain: string |}>
}) {
  const timestamp = now();
  const { client, helpers } = ctx;
  const { operations } = helpers;
  const { setIfNull } = operations;
  const attribution = {
    "clearbit/fetched_at": timestamp,
    "clearbit/prospected_at": timestamp,
    "clearbit/source": setIfNull("prospector")
  };
  try {
    const promises = prospects.map(prospect =>
      saveProspect({
        ctx,
        attribution,
        account: account || { domain: prospect.domain, segment_ids: [] },
        prospect
      })
    );
    if (account) {
      promises.push(
        client.asAccount(account).traits({
          ...attribution,
          "clearbit/prospected_users": {
            operation: "increment",
            value: prospects.length
          }
        })
      );
    } else {
      _.map(_.uniq(_.compact(_.map(prospects, "domain"))), domain => {
        promises.push(
          client.asAccount({ domain }).traits({
            ...attribution,
            "clearbit/prospected_users": { operation: "increment", value: 1 }
          })
        );
      });
    }
    return promises;
  } catch (err) {
    client.logger.error("prospect.error", { err });
    throw err;
  }
}

export async function saveAccount(
  ctx: HullContext,
  {
    account,
    person = {},
    company,
    user,
    source
  }: {
    account: HullAccount,
    user?: HullUser,
    person: ClearbitPerson,
    company: ClearbitCompany,
    source: "prospect" | "enrich" | "discover" | "reveal"
  }
) {
  // meta?: {} = {}
  const { client, metric, helpers } = ctx;
  const { mapAttributes, operations } = helpers;
  const { setIfNull } = operations;

  const timestamp = now();
  const traits = {
    ...mapAttributes({
      entity: company,
      mapping: "incoming_company_mapping",
      type: "company",
      direction: "incoming"
    }),
    "clearbit/id": company.id,
    "clearbit/fetched_at": timestamp,
    ...(source
      ? {
          "clearbit/source": setIfNull(source),
          [`clearbit/${source}ed_at`]: timestamp
        }
      : {})
  };

  const accountClaims = { ...account };
  const clearbitAccountClaim = getClearbitAnonymousId(company);
  if (clearbitAccountClaim) {
    accountClaims.anonymous_id = clearbitAccountClaim;
  }

  const userClaims = { ...user };
  const clearbitClaim = getClearbitAnonymousId(person);
  if (clearbitClaim) {
    userClaims.anonymous_id = clearbitClaim;
  }
  const asAccount = _.isEmpty(account)
    ? client.asUser(userClaims).account(accountClaims)
    : client.asAccount(accountClaims);

  await asAccount.traits(traits);

  // asAccount.logger.info("incoming.account.success", {
  //   ...meta,
  //   source
  //   // traits
  // });

  metric.increment("ship.incoming.accounts", 1, ["saveAccount"]);
  return company;
}

export async function saveUser(
  ctx: HullContext,
  {
    user,
    person,
    source
  }: {
    user: HullUser,
    person?: ClearbitPerson,
    source: "prospect" | "enrich" | "discover" | "reveal"
  }
) {
  // meta?: {} = {}
  const { client, metric, helpers } = ctx;
  const { mapAttributes, operations } = helpers;
  const { setIfNull } = operations;

  // Never ever change the email address (Clearbit strips +xxx parts, so we end up
  // with complete messed up ident claims if we do this). We need to pass all claims
  // to the platform to allow proper identity resolution.

  // if (!person) {
  //   return;
  // }

  const asUser = client.asUser({
    ...user,
    ...(person ? { anonymous_id: getClearbitAnonymousId(person) } : {})
  });

  const timestamp = now();
  const traits = {
    ...(person
      ? mapAttributes({
          entity: person,
          type: "person",
          mapping: "incoming_person_mapping",
          direction: "incoming"
        })
      : {}),
    "clearbit/fetched_at": timestamp,
    ...(source
      ? {
          "clearbit/source": setIfNull(source),
          [`clearbit/${source}ed_at`]: timestamp
        }
      : {})
  };

  await asUser.traits(traits);
  metric.increment("ship.incoming.users", 1, ["saveUser"]);
  // asUser.logger.info("incoming.user.success", { ...meta, source });
  // return { traits, user, person };
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
