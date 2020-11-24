import _ from "lodash";
import moment from "moment";

const eventName = "Created Ticket";
const propertiesToPick = [
  "id",
  "url",
  "subject",
  "description",
  "priority",
  "organization_id",
  "requester_id",
  "submitter_id",
  "assignee_id",
  "tags"
];

export default async function handle({ hull, private_settings, request }) {
  const apiToken = private_settings.api_token;
  const userEmail = private_settings.user_email;
  const supportUrl = _.trimEnd(private_settings.support_url, "/");
  const syncInterval = private_settings.sync_interval;

  if (!apiToken || !userEmail || !supportUrl) {
    throw new Error("Missing configuration.");
  }

  const createdAfter = moment()
    .subtract(syncInterval + 5, "minutes")
    .format();
  hull.logger.info("incoming.job.start", { createdAfter });

  const ticketsRes = await request
    .get(`${supportUrl}/api/v2/search.json`)
    .query({ sort_by: "created_at" })
    .query({ sort_order: "asc" })
    .query({
      query: `type:ticket status:open status:pending created>${createdAfter}`
    })
    .auth(`${userEmail}/token`, apiToken);

  if (!ticketsRes.body || !ticketsRes.body.results) {
    throw new Error(
      "Malformed response from Zendesk API when searching for tickets."
    );
  }

  if (ticketsRes.body.results.length === 0) {
    return true;
  }

  if (
    ticketsRes.body.next_page !== null ||
    ticketsRes.body.results.length > 100 ||
    ticketsRes.body.count > 100
  ) {
    throw new Error(
      `More than 100 created events in last ${syncInterval} minutes. Consider running the connector more often.`
    );
  }

  const tickets = ticketsRes.body.results;
  const ids = _(tickets)
    .map("requester_id")
    .uniq();

  const usersRes = await request
    .get(`${supportUrl}/api/v2/users/show_many.json`)
    .query({ ids: ids.join(",") })
    .auth(`${userEmail}/token`, apiToken);

  if (!usersRes.body || !usersRes.body.users || !usersRes.body.users) {
    throw new Error(
      "Malformed response from Zendesk API when fetching users' data."
    );
  }
  const users = usersRes.body.users;
  const usersById = _(users)
    .groupBy("id")
    .mapValues(_.first)
    .value();
  hull.logger.info("incoming.job.progress", {
    tickets: tickets.length,
    users: users.length
  });

  const promises = tickets.map(ticket => {
    const user = usersById[ticket.requester_id];

    if (!user) {
      hull.logger.error("incoming.event.error", {
        error: "Cannot find matching user",
        ticket
      });
      return Promise.resolve();
    }
    const userIdent = {
      anonymous_id: `zendesk:${user.id}`,
      email: user.email
    };
    const eventProperties = _.pick(ticket, propertiesToPick);
    const eventContext = {
      event_id: `zendesk:${supportUrl}:${ticket.id}`,
      created_at: ticket.created_at
    };

    const ticketUrl = `${supportUrl}/agent/tickets/${ticket.id}`;
    eventProperties.ticket_url = ticketUrl;

    return hull
      .asUser(userIdent)
      .track(eventName, eventProperties, eventContext);
  });

  return Promise.all(promises).then(() => "ok");
}
