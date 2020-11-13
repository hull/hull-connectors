# Stripe

This connector captures Stripe charges, invoice and subscription events and adds them to your Hull User profiles.
It also handles Customer profile updates and captures them as
We use the `email` field to reconcile transactions.

## Getting Started

## Reference

Events map:

| Stripe Event Name | Hull Event Name |
| ----------------- | --------------- |


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
