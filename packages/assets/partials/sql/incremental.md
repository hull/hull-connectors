## Query data that has changed in a given time period (Incremental Queries)

If the tables in your SQL database hold large sets of data, you might want to query only data that has changed within the last couple of days - this is what we call **incremental queries**. The advantage of incremental queries is that you return a smaller subset of data that can be processed faster which improves the overall performance and reduces your number of Incoming requests.

You can write an incremental query by using the placeholder `:import_start_date` in your query string. The SQL connector will automatically replace this at runtime with a proper datetime value that represents the current point of time x days ago. Here is an example of an incremental query:

```
SELECT id as external_id, email as email, firstname as first_name
FROM users
WHERE updated_at >= :import_start_date
```

You can define the number of days on the tab “Settings“ in the section “Connector Configuration”:

Please enter the number of days as integer or whole number. Fractional days are not supported.
