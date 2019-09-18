const _ = require("lodash");
const baseSmartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/account-update.json"));

module.exports = () => {
  const acctSegmentId = _.get(baseSmartNotifierPayload, "messages[0].account_segments[0].id");
  _.set(baseSmartNotifierPayload, "connector.private_settings.synchronized_account_segments", [acctSegmentId]);

  _.set(baseSmartNotifierPayload, "messages[0].account.madkudu/fetched_at", "2018-03-20T09:57:14+00:00");
  _.set(baseSmartNotifierPayload, "messages[0].account.madkudu/customer_fit_segment", "good");
  _.set(baseSmartNotifierPayload, "messages[0].account.madkudu/name", "MadKudu Inc");
  _.set(baseSmartNotifierPayload, "messages[0].account.madkudu/number_of_employees", 17000);
  _.set(baseSmartNotifierPayload, "messages[0].account.madkudu/signal_employee_count", "180");
  _.set(baseSmartNotifierPayload, "messages[0].account.madkudu/signal_web_traffic_volume", "medium");
  _.set(baseSmartNotifierPayload, "messages[0].account.madkudu/top_signals_positive", ["employee count", "web traffic volume"]);
  return baseSmartNotifierPayload;
};
