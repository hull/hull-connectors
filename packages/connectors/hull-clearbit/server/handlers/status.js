// @flow
import _ from "lodash";
import type { HullContext } from "hull";

export default function statusCheck(ctx: HullContext) {
  const { connector } = ctx;
  const { private_settings } = connector;
  const messages = [];
  let status = "ok";
  const {
    api_key,
    // discover_enabled,
    enrich_enabled,
    prospect_enabled,
    enrich_user_segments,
    reveal_user_segments,
    reveal_enabled,
    prospect_filter_seniority,
    prospect_filter_titles,
    prospect_filter_role,
    prospect_domain,
    prospect_segments
  } = private_settings;

  const any_enabled = enrich_enabled || prospect_enabled || reveal_enabled;

  if (!api_key) {
    status = "warning";
    messages.push(
      "No API Key stored, connector is inactive. Enter API key in Settings"
    );
  }
  if (!any_enabled) {
    messages.push("No Clearbit API enabled, enable some sections in Settings");
  }
  if (enrich_enabled && !_.size(enrich_user_segments)) {
    messages.push(
      "Enrich enabled, but no segments are listed. No one will be enriched"
    );
  }
  if (reveal_enabled && !_.size(reveal_user_segments)) {
    messages.push(
      "Reveal enabled, but no segments are listed. No one will be revealed"
    );
  }

  if (prospect_enabled) {
    if (!_.size(prospect_segments)) {
      messages.push(
        "Prospector enabled, but no segments are listed. No one will trigger prospection"
      );
    } else if (_.size(prospect_filter_role)) {
      status = "warning";
      messages.push(
        "Prospector enabled, but no Roles are listed. Prospection will be unpredictable"
      );
    } else if (!prospect_domain) {
      status = "error";
      messages.push(
        "Prospector enabled, but no 'Company Domain' field is set. We need to know what domain to lookup"
      );
    } else if (!prospect_filter_seniority) {
      status = "ok";
      messages.push(
        "Prospector enabled, but no Seniority is listed. Prospection might return underqualified results"
      );
    } else if (!prospect_filter_titles) {
      status = "ok";
      messages.push(
        "Prospector enabled, but no Titles are listed. Prospection might return underqualified results"
      );
    } else if (!prospect_filter_role) {
      status = "ok";
      messages.push(
        "Prospector enabled, but no Roles are listed. Prospection might return underqualified results"
      );
    }
  }
  return {
    status,
    messages
  };
}
