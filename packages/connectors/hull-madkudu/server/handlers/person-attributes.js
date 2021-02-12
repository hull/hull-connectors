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
          value: "properties.first_name",
          label: "first_name"
        },
        {
          value: "properties.last_name",
          label: "last_name"
        },
        {
          value: "properties.domain",
          label: "domain"
        },
        {
          value: "properties.is_student",
          label: "is_student"
        },
        {
          value: "properties.is_spam",
          label: "is_spam"
        },
        {
          value: "properties.is_personal_email",
          label: "is_personal_email"
        },
        {
          label: "Customer Fit",
          options: [
            {
              value: "properties.customer_fit.segment",
              label: "customer_fit_segment"
            },
            {
              value: "properties.customer_fit.score",
              label: "customer_fit_score"
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
