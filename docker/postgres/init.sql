-- Runs once, when the Postgres volume is first created.
-- A test database alongside the dev one, so tests never touch dev data.
CREATE DATABASE haazir_test OWNER haazir;

\connect haazir
CREATE EXTENSION IF NOT EXISTS vector;

\connect haazir_test
CREATE EXTENSION IF NOT EXISTS vector;
