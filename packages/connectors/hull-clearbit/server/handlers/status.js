// @flow
import _ from "lodash";
import type { HullContext } from "hull";

export default function statusCheck(ctx: HullContext) {
  const { connector, client } = ctx;
  const { private_settings } = connector;
  const messages = [];
  let status = "ok";

  const {
    api_key,
    enrich_user_segments,
    enrich_account_segments,
    reveal_user_segments,
    prospect_filter_seniorities,
    prospect_filter_titles,
    prospect_filter_roles,
    lookup_domain,
    lookup_email,
    prospect_account_segments,
    prospect_limit_count
  } = private_settings;

  if (!api_key) {
    status = "warning";
    messages.push(
      "No API Key stored, connector is inactive. Enter API key in Settings"
    );
  }
  if (!_.size(enrich_user_segments)) {
    messages.push(
      "Enrich enabled, but no User segments are listed. No User will be enriched"
    );
  }
  if (!_.size(enrich_account_segments)) {
    messages.push(
      "Enrich enabled, but no Account segments are listed. No Accounts will be enriched"
    );
  }
  if (!_.size(reveal_user_segments)) {
    messages.push(
      "Reveal enabled, but No User segments are listed. No User will be revealed"
    );
  }

  if (!_.size(prospect_account_segments)) {
    messages.push(
      "Prospector enabled, but no Account segments are listed. No Account will trigger prospection"
    );
  }
  if (!_.size(prospect_filter_roles)) {
    status = "warning";
    messages.push(
      "Prospector enabled, but no Roles are listed. Prospection will be unpredictable"
    );
  }
  if (!lookup_domain) {
    status = "error";
    messages.push(
      "No 'Company Domain' set. We need to know what domain to lookup"
    );
  }
  if (!lookup_email) {
    status = "error";
    messages.push("No 'User Email' set. We need to know what email to lookup");
  }
  if (!prospect_filter_seniorities) {
    status = "ok";
    messages.push(
      "Prospector enabled, but no Seniority is listed. Prospection might return underqualified results"
    );
  }
  if (!prospect_filter_titles) {
    status = "ok";
    messages.push(
      "Prospector enabled, but no Titles are listed. Prospection might return underqualified results"
    );
  }
  if (!prospect_filter_roles) {
    status = "ok";
    messages.push(
      "Prospector enabled, but no Roles are listed. Prospection might return underqualified results"
    );
  } else if (prospect_limit_count > 20) {
    status = "ok";
    messages.push(
      `Prospector limit count is high ${prospect_limit_count}. We recommend keeping it under 20`
    );
  }

  client.logger.info("connector.status", { status, messages });

  return {
    status,
    messages
  };
}
