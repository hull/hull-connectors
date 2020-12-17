import _ from "lodash";
import moment from "moment";

// make project id configurable
// make apiToken configurable
// Then manually add webhook
// surface webhook id so that it can easily be deleted

export default async function handle({ hull, private_settings, headers, body, request }) {

  //determine if this webhook has been established or not by looking in the private settings
  // update it on first secret push...

  const api_token = private_settings.api_token;
  if (_.isNil(api_token)) {
    return;
  }

  const webhookEstablished = _.get(private_settings, "webhook_established");

  const secret = headers['x-hook-secret'];

  if (_.isNil(webhookEstablished) && secret) {
    console.log(`Establishing webhook: ${webhookEstablished}`);
    await hull.utils.settings.update({ "webhook_established": true });
    return {
      status: 200,
      data: {},
      headers: {'X-Hook-Secret': secret, 'Content-Type': 'application/json'}
    }
  }

  const events = _.get(body, "events", []);


  const addedToSection = _.filter(events, (event) => {
    const resource = _.get(event, "resource.resource_type");
    const addedTo = _.get(event, "parent.resource_type");
    return resource === "task" && addedTo === "section";
  })

  const tasksWithNewSectionsRequests = await Promise.all(addedToSection.map((switchSectionEvent) => {
    return request
      .get(`https://app.asana.com/api/1.0/tasks/${switchSectionEvent.resource.gid}`)
      .auth(api_token, { type: 'bearer' });
  }));

  const tasks = tasksWithNewSectionsRequests.map(response => {
    return _.get(response, "body.data");
  });

  const tasksToEmitEvents = _.reduce(tasks, (requests, task) => {
    const memberships = _.get(task, "memberships", []);
    const firstMembership = memberships[0];
    const projectId = _.get(firstMembership, "project.gid");
    const projectName = _.get(firstMembership, "project.name");
    const sectionName = _.get(firstMembership, "section.name");
    const ticketId = _.get(task, "gid");
    const ticketName = _.get(task, "name");

    requests.push(hull
      .asUser({ external_id: `asana_project:${projectId}`})
      .track("Asana Task Created",
        {
          projectId,
          projectName,
          ticketId,
          ticketName,
          status: sectionName
        },
        {
          event_id: ticketId,
          created_at: task.created_at
        }));
    return requests;
  }, []);

  return tasksToEmitEvents;

}
