//@noflow
import queries from "./queries";

/**
 * return { events, pagination }
 */
module.exports = function fetchEvent({ client, search }) {
  const { id } = search;
  let params = {};

  params = queries.eventId(id);

  return client
    .post("search/events", params)

    .then(
      ({ pagination = {}, data = [] }) => {
        if (!data.length) return Promise.reject();
        return { events: data, pagination };
      },
      err => console.log(err)
    );
};
