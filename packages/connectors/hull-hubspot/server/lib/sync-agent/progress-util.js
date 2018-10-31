const moment = require("moment");
// const { settingsUpdate } = require("hull/src/utils");

class ProgressUtil {
  constructor(ctx) {
    this.settingsUpdate = ctx.helpers.settingsUpdate;
  }

  start() {
    return this.settingsUpdate({
      last_fetch_started_at: moment()
        .utc()
        .format(),
      is_fetch_completed: false,
      fetch_count: 0
    });
  }

  update(newProgress) {
    return this.settingsUpdate({
      fetch_count: newProgress
    });
  }

  stop() {
    return this.settingsUpdate({
      is_fetch_completed: true
    });
  }
}

module.exports = ProgressUtil;
