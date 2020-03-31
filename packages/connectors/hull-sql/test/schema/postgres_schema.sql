\i tests/schema/faker/first_names.sql
\i tests/schema/faker/last_names.sql
\i tests/schema/faker/functions.sql

DROP VIEW IF EXISTS users_view;
DROP VIEW IF EXISTS dummy_view;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id    integer,
    first_name varchar(40),
    last_name  varchar(40),
    email      varchar(80),
    foo_integer integer,
    foo_date TIMESTAMPTZ,
    PRIMARY KEY(user_id)
);

INSERT INTO users VALUES
    (1, 'Michal', 'Smith', 'michal@smiths.com', 123, now()::date - interval '5 days'),
    (2, 'Stephane', 'Mitnick', 'stephane@mitnicks.com', 123, now()),
    (3, 'Romain', 'Liskov', 'romain@liskovs.com', 123, now()::date - interval '1 days');



CREATE VIEW users_view AS SELECT user_id as id, first_name as name, email, foo_integer as foo_numeric, foo_date FROM users LIMIT 10;

CREATE VIEW dummy_view AS
  SELECT generate_series as external_id, faker_first_name() as first_name, faker_last_name() as last_name, ceil(random() * 10) as random_rank FROM generate_series(1,31000);

-- to load the schema
-- bash test/schema/install_faker.sh
-- docker run -it --rm -v `pwd`:/app -w /app --network=host postgres:9.6 bash -c 'cat test/schema/postgres_schema.sql | PGPASSWORD=postgres psql -h localhost -U postgres'

-- example query:
-- SELECT id as external_id, name as first_name, foo_numeric as testing_trait, foo_date FROM users_view

-- SELECT id as external_id, name as first_name, foo_numeric as testing_trait, foo_date FROM users_view WHERE foo_date >= :import_start_date

-- SELECT * FROM dummy_view
