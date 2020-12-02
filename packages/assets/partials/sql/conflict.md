## Define behavior in case of a data conflict

A user profile in Hull is usually composed of data from a multitude of sources, so it is possible that you have already stored a value for a given trait and your SQL data source returns a different value. Let’s say you have already stored the phone number `123-444-6666` in the user profile for Brad Smith but your query returns the number `456-233-8899`. This represents a typical data conflict and you can decide how the SQL connector shall resolve this conflict: either keep the number or overwrite it. By selecting `Use SQL value in case of data conflict` in the connector configuration section, you make the decision that your SQL data source is the leading system for the particular traits it returns:

Note: The default behavior is to use the SQL value in case of data conflict. This is consistent across all connectors in Hull.
