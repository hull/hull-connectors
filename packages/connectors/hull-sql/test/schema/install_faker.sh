#!/bin/bash
mkdir -p test/schema/faker
curl https://raw.githubusercontent.com/jbranchaud/pg_faker/master/sql/first_names.sql -o test/schema/faker/first_names.sql
curl https://raw.githubusercontent.com/jbranchaud/pg_faker/master/sql/last_names.sql -o test/schema/faker/last_names.sql
curl https://raw.githubusercontent.com/jbranchaud/pg_faker/master/sql/functions.sql -o test/schema/faker/functions.sql

