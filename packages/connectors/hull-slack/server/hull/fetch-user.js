//@noflow
import _ from "lodash";
import queries from "./queries";

/**
 * return { user, events, segments, pagination }
 */

module.exports = function fetchUser({ hull, search, options = {} }) {
  const { email, name, id } = search;
  let params = {};

  if (id) params = queries.id(id);
  else if (email) params = queries.email(email);
  else if (name) params = queries.name(name);

  const eventSearch = options.action && options.action.value === "events";

  hull.logger.debug("outgoing.user.search", params);

  return hull
    .post("search/user_reports", params)

    .then(args => {
      const { pagination = {}, data = [] } = args;
      const [user] = data;
      if (!user || !user.id)
        return Promise.reject({ message: "User not found!" });

      const q = [hull.asUser(user.id).get("/me/segments")];
      if (eventSearch) {
        const eventParams = search.rest
          ? queries.filteredEvents(user.id, search.rest)
          : queries.events(user.id);
        hull.logger.debug("outgoing.event.search", eventParams);
        q.push(hull.post("search/events", eventParams));
      }
      return Promise.all(q).then(
        ([segments, events = {}]) => {
          if (eventSearch && !events.data.length)
            return {
              message: `\n Couldn't find "${search.rest}" events for ${
                user.name
              } - Search is case-sensitive`,
            };

          if (!user) return { message: "Couldn't find anyone!" };

          // const groupedUser = hull.utils.groupTraits(
          //   _.omitBy(user, v => v === null || v === "" || v === undefined)
          // );
          const { account } = user;
          return {
            user: _.omit(user, "account"),
            account,
            events: events.data,
            segments,
            pagination,
          };
        },
        err => {
          return { message: `An error occured ${err.message}!` };
        },
        err => {
          return { message: `An error occured ${err.message}!` };
        }
      );
    });
};
