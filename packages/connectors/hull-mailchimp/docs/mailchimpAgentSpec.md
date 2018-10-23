```javascript
getAddToListOps(users, jobs = []) {
  return users.map(user => {
    const hash = this.getEmailHash(user.email);
    const operation_id = helper.getOperationId(jobs, {
      user: _.pick(user, ["id", "email", "segment_ids"]),
      path: `/lists/${this.listId}/members/${hash}`
    });
    return {
      operation_id,
      method: "PUT",
      path: `/lists/${this.listId}/members/${hash}`,
      body: JSON.stringify({
        email_type: "html",
        merge_fields: {
          FNAME: user.first_name || "",
          LNAME: user.last_name || ""
        },
        email_address: user.email,
        status_if_new: "subscribed"
      })
    };
  });
}

getAddToAudiencesOps(users) {
  return _.reduce(users, (ops, user) => {
    const listId = req.shipApp.listId;
    const subscriberHash = this.getSubscribedHash(user.email);
    const audienceIds = user.segment_ids.map(s => req.shipApp.segmentsMapping.getAudienceId(s));

    _.map(audienceIds, audienceId => {
      const op = {
        method: "POST",
        path: `/lists/${listId}/segments/${audienceId}/members`
        body: JSON.stringify({
          email_address: user.email,
          status: "subscribed"
        })
      };
      ops.push(op);
    });
    return ops;
  }, []);
}

getRemoveFromAudiencesOp(users) {
  return _.reduce(users, (ops, user) => {
    const listId = req.shipApp.listId;
    const subscriberHash = this.getSubscribedHash(user.email);
    let audienceIds = user.remove_segment_ids.map(s => req.shipApp.segmentsMapping.getAudienceId(s));

    _.map(audienceIds, audienceId => {
      const op = {
        method: "DELETE",
        path: `/lists/${listId}/segments/${audienceId}/members/${subscriberHash}`,
      };
      ops.push(op);
    });
    return ops;
  }, []);
}

getUsersFromOperations(operations) {
  const users = operations.map(op => op.data);
  return users;
}
```
