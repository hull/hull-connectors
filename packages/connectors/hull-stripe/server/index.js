import _ from "lodash";
import moment from "moment";

async function handleCustomerData(hull, data) {
  const userIdent = {
    email: _.get(data, "email", null),
    anonymous_id: `stripe:${_.get(data, "id", null)}`
  };

  const attribs = {
    "stripe/email": _.get(data, "email", null),
    "stripe/id": _.get(data, "id", null),
    "stripe/created_at": moment(
      _.get(data, "created", null) * 1000
    ).toISOString(),
    "stripe/delinquent": _.get(data, "delinquent", null),
    "stripe/discount": _.get(data, "discount", null),
    "stripe/account_balance": _.get(data, "balance", null),
    "stripe/description": _.get(data, "description", null),
    "stripe/currency": _.get(data, "currency", null)
  };

  return hull.asUser(userIdent).traits(attribs);
}

export default async function handle({ hull, body }) {
  const typeMappingsEvents = [
    {
      key: "charge.failed",
      name: "Charge failed"
    },
    {
      key: "charge.succeeded",
      name: "Charge succeeded"
    },
    {
      key: "charge.refunded",
      name: "Charge Refunded"
    },
    {
      key: "invoice.payment_failed",
      name: "Invoice Payment Failed"
    },
    {
      key: "invoice.payment_succeeded",
      name: "Invoice Payment Succeeded"
    },
    {
      key: "invoice.upcoming",
      name: "Invoice Upcoming"
    },
    {
      key: "invoice.updated",
      name: "Invoice Updated"
    },
    {
      key: "invoice.created",
      name: "Invoice Created"
    },
    {
      key: "customer.subscription.updated",
      name: "Subscription Updated"
    },
    {
      key: "customer.subscription.created",
      name: "Subscription Created"
    },
    {
      key: "customer.subscription.deleted",
      name: "Subscription Ended"
    }
  ];

  /*
   * General Execution
   */
  const data = _.get(body, "data", {});
  const liveMode = _.get(body, "livemode", false);
  const objType = _.get(body, "object", "foo");
  const objId = _.get(body, "id", null);
  const payloadType = _.get(body, "type", null);

  if (liveMode !== true) {
    return {};
  }

  if (
    payloadType === "customer.updated" ||
    payloadType === "customer.created"
  ) {
    console.log("Customer created or updated");
    return handleCustomerData(hull, data.object);
  }
  if (objType === "event") {
    const currentType = _.find(typeMappingsEvents, {
      key: payloadType
    });
    let userIdent = {};
    let created_at = moment().toISOString();
    if (!_.isNil(_.get(body, "created", null))) {
      created_at = moment(body.created * 1000).toISOString();
    }
    const trackEvent = {
      eventName: null,
      props: {},
      ctx: {
        id: objId,
        event_id: objId,
        created_at
      }
    };
    hull.logger.debug(currentType);

    if (!currentType) {
      return {};
    }

    _.set(trackEvent, "eventName", currentType.name);

    switch (currentType.key) {
      case "charge.failed":
      case "charge.succeeeded":
      case "charge.refunded":
        // eslint-disable-next-line no-case-declarations
        const mapCharge = {
          id: "charge_id?",
          invoice: "invoice_id?",
          order: "order_id?",
          amount: "amount?",
          currency: "currency?",
          description: "description?",
          failure_code: "failure_code?",
          failure_message: "failure_message?",
          paid: "paid?",
          receipt_email: "receipt_email?",
          receipt_number: "receipt_number?",
          refunded: "refunded?",
          status: "status?",
          amount_refunded: "amount_refunded"
        };

        _.forIn(mapCharge, (v, k) => {
          if (
            _.endsWith(v.replace("?", ""), "_at") &&
            !_.isNil(_.get(data.object, k, null))
          ) {
            _.set(
              trackEvent,
              `props.${v.replace("?", "")}`,
              moment(_.get(data.object, k) * 1000).toISOString()
            );
          } else {
            _.set(
              trackEvent,
              `props.${v.replace("?", "")}`,
              _.get(data.object, k, null)
            );
          }
        });

        // User Ident
        _.set(userIdent, "email", _.get(data.object, "customer_email", null));
        if (!_.isNil(_.get(data.object, "customer", null))) {
          _.set(
            userIdent,
            "anonymous_id",
            `stripe:${_.get(data.object, "customer", null)}`
          );
        }
        break;
      case "invoice.payment_failed":
      case "invoice.payment_succeeded":
      case "invoice.upcoming":
      case "invoice.updated":
      case "invoice.created":
        // eslint-disable-next-line no-case-declarations
        const mapInvoice = {
          tax: "tax",
          tax_percent: "tax_percent",
          forgiven: "forgiven",
          total: "total",
          subtotal: "subtotal",
          application_fee: "application_fee",
          attempt_count: "attempt_count",
          attempted: "attempted",
          charge: "charge",
          closed: "closed",
          currency: "currency",
          starting_balance: "starting_balance",
          ending_balance: "ending_balance",
          paid: "paid",

          id: "invoice_id",
          order: "order_id",
          description: "description",
          date: "invoiced_at",
          period_end: "period_end_at",
          period_start: "period_start_at",
          next_payment_attempt: "next_payment_attempt_at",

          "discount.start": "discount.start_at",
          "discount.end": "discount.end_at",

          "discount.coupon.id": "coupon_id",
          "discount.coupon.amount_off": "coupon_amount_off",
          "discount.coupon.created": "coupon_created_at",
          "discount.coupon.currency": "coupon_currency",
          "discount.coupon.duration": "coupon_duration",
          "discount.coupon.duration_in_months": "coupon_duration_in_months",
          "discount.coupon.percent_off": "coupon_percent_off",
          amount_refunded: "amount_refunded"
        };

        _.forIn(mapInvoice, (v, k) => {
          if (
            _.endsWith(v.replace("?", ""), "_at") &&
            !_.isNil(_.get(data.object, k, null))
          ) {
            _.set(
              trackEvent,
              `props.${v.replace("?", "")}`,
              moment(_.get(data.object, k) * 1000).toISOString()
            );
          } else {
            _.set(
              trackEvent,
              `props.${v.replace("?", "")}`,
              _.get(data.object, k, null)
            );
          }
        });

        // Summarize line data
        _.set(
          trackEvent,
          "props.amounts",
          _.get(data.object, "lines.data", []).map(l => l.amount)
        );
        _.set(
          trackEvent,
          "props.plan_ids",
          _.get(data.object, "lines.data", []).map(l =>
            _.get(l, "plan.id", null)
          )
        );
        _.set(
          trackEvent,
          "props.plan_names",
          _.get(data.object, "lines.data", []).map(l =>
            _.get(l, "plan.name", null)
          )
        );
        _.set(
          trackEvent,
          "props.plan_amounts",
          _.get(data.object, "lines.data", []).map(l =>
            _.get(l, "plan.amount", null)
          )
        );

        // User Ident
        _.set(userIdent, "email", _.get(data.object, "customer_email", null));
        if (!_.isNil(_.get(data.object, "customer", null))) {
          _.set(
            userIdent,
            "anonymous_id",
            `stripe:${_.get(data.object, "customer", null)}`
          );
        }

        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        // eslint-disable-next-line no-case-declarations
        const mapSubscription = {
          id: "subscription_id?",
          "items.total_count": "items_count?",
          "plan.amount": "amount?",
          "plan.currency": "currency?",
          "plan.id": "plan_id?",
          "plan.interval": "interval?",
          "plan.name": "plan_name?",
          application_fee_percent: "application_fee_percent?",
          cancel_at_period_end: "cancel_at_period_end?",
          canceled_at: "canceled_at?",
          created: "created_at?",
          current_period_end: "current_period_end_at?",
          current_period_start: "current_period_start_at?",
          discount: "discount?",
          ended_at: "ended_at?",
          status: "status?",
          tax_percent: "tax_percent?",
          trial_end: "trial_end_at?",
          trial_start: "trial_start_at?"
        };
        _.forIn(mapSubscription, (v, k) => {
          if (
            _.endsWith(v.replace("?", ""), "_at") &&
            !_.isNil(_.get(data.object, k, null))
          ) {
            _.set(
              trackEvent,
              `props.${v.replace("?", "")}`,
              moment(_.get(data.object, k) * 1000).toISOString()
            );
          } else {
            _.set(
              trackEvent,
              `props.${v.replace("?", "")}`,
              _.get(data.object, k, null)
            );
          }
        });

        // User Ident
        _.set(userIdent, "email", _.get(data.object, "customer_email", null));
        if (!_.isNil(_.get(data.object, "customer", null))) {
          _.set(
            userIdent,
            "anonymous_id",
            `stripe:${_.get(data.object, "customer", null)}`
          );
        }

        break;
      default:
        console.log("missed conditions");
    }

    userIdent = _.pickBy(userIdent, _.identity);
    if (Object.keys(userIdent).length > 0) {
      return hull
        .asUser(userIdent)
        .track(trackEvent.eventName, trackEvent.props, trackEvent.ctx);
    }
  }
  return {};
}
