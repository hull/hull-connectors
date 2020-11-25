## Synchronizing data on a scheduled basis

If you activate the `Enable Sync` checkbox, your query will run on a given time interval to import the data on a regular schedule.

By default, the query runs automatically every 3 hours. You can select the interval here to balance performance and load.
To increase performance we recommend to use incremental queries (see below).

Note: If the `Enable Sync` checkbox is disabled, the query won't run automatically (this is the default).
You can still run one-off imports from the Query Editor screen by clicking on the button “Import everything” after a successful preview.
