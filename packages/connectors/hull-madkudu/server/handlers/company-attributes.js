/* @flow */
import type { HullUISelectResponse, HullContext } from "hull";

export default async function statusHandler(
  _ctx: HullContext
): HullUISelectResponse {
  return {
    status: 200,
    data: {
      options: [
        {
          value: "properties.name",
          label: "name"
        },
        {
          value: "properties.domain",
          label: "domain"
        },
        {
          value: "properties.number_of_employees",
          label: "number_of_employees"
        },
        {
          value: "properties.industry",
          label: "industry"
        },
        {
          label: "Location",
          options: [
            {
              value: "properties.location.state",
              label: "location_state"
            },
            {
              value: "properties.location.state_code",
              label: "location_state_code"
            },
            {
              value: "properties.location.country",
              label: "country"
            },
            {
              value: "properties.location.country_code",
              label: "country_code"
            },
            {
              value: "properties.location.tags",
              label: "location_tags"
            }
          ]
        },
        {
          label: "Customer Fit",
          options: [
            {
              value: "properties.customer_fit.segment",
              label: "customer_fit_segment"
            },
            {
              value: "properties.customer_fit.top_signals_formated",
              label: "customer_fit_top_signals_formated"
            },
            {
              value: "properties.customer_fit.top_signals",
              label: "customer_fit_top_signals"
            },
            {
              value:
                "properties.customer_fit.top_signals[type='positive'].name",
              label: "customer_fit_top_signals_positive"
            },
            {
              value:
                "properties.customer_fit.top_signals[type='negative'].name",
              label: "customer_fit_top_signals_negative"
            }
          ]
        }
      ]
    }
  };
}
