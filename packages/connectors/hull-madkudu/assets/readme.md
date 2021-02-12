# Hull Madkudu Connector

The Madkudu Connector enables your sales and marketing teams to enrich accounts with predictive Scores and signals from Madkudu

## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” on the Madkudu card. After installation, switch to the “Settings” tab and begin with the configuration.

Begin your configuration in the section **Authentication** by copying the Madkudu API key into the provided field. If you are not sure which key to use, see [Find your Madkudu Credentials](https://docs.madkudu.com/integrations/http_api/) for details.

Please save your changes and navigate back to the Dashboard.
The connector requires Domain and Clearbit enrichment data to work

## How it works

When Hull detects a new account that Madkudu hasn't scored yet, Hull fetches account data from Madkudu, enriches the Hull profile, and updates all your tools.

The enriched profiles solves 2 problems for your sales reps:

- Reduces wasted time on unqualified leads.
- Prevents reps from missing high-value leads.

## Madkudu's Solution
Unlike traditional lead scoring solutions, MadKudu requires no manual effort or guesswork. MadKudu uses rigorous statistical methods based on data science to identify the most qualified leads based on customer demographics.

Additionally, MadKudu uses a customer’s in-app behavior to detect sales opportunities such as closing, churn, or upsell.

## Features

The Madkudu Connector allows your team to enrich account profiles with predictive scores from the Madkudu API. With the additional data points returned from Madkudu you can trigger further automatization in other connected tools and ensure that all your customer-facing teams have the most useful data in their system of record.

#### When do users get enriched?

The Connector will attempt an enrichment and will call the Madkudu API only if the following conditions are met:
- Domain is filled in
- Clearbit Company Data is present at the Account level
- A previous attempt hasn't been performed.

Please note that accounts get only enriched ***exactly once***. After one attempt, the date at which the attempt was made will be written in the profile and Madkudu enrichment will be skipped.

#### How long does it take to enrich users?

In most cases this process is performed near-real time.

#### How can I tell if enrichment has been performed for a given user?

The Madkudu Connector adds the attribute `Madkudu/fetched_at` to every user profile it has enriched.
