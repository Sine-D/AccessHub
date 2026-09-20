# AC-185 database setup
The ZIP contains no place-table migration or deployed place API implementation.
The supplied migration creates a dedicated accesshub_places public directory table.
Review and run it in the team's Supabase SQL editor once. Existing tables are untouched.
Populate it only with verified place records and set published=true for publicly visible records.
Canonical accessibility_features IDs are listed in the CHECK constraint.
Unknown/unverified facilities must not be inserted as available features.
The existing browser mock data works without a database. A local mock demo does not prove RLS or SQL deployment.

