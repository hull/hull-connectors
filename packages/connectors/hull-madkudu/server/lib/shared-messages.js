const SHARED_MESSAGES = {
  SKIP_ACCOUNT_NOTINSEGMENTS:
    "Account is not in the whitelisted segments and will not be enriched with Madkudu data.",
  SKIP_ACCOUNT_ALREADYENRICHED:
    "Account has been already enriched with Madkudu data and will therefore not be enriched again.",
  SKIP_ACCOUNT_INSUFFICIENTDATA:
    "Account has no clearbit data which is required to run enrichment via Madkudu.",
  SKIP_USER_NOTINSEGMENTS:
    "User is not in the whitelisted segments and will not be sent to Madkudu endpoint."
};

module.exports = SHARED_MESSAGES;
