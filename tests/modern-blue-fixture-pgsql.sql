-- Disposable PostgreSQL database for checking the Modern Blue design by hand
-- Load: createdb mb_shop && psql -d mb_shop -f tests/modern-blue-fixture-pgsql.sql

CREATE TABLE categories (
	id serial PRIMARY KEY,
	name varchar(100) NOT NULL,
	description text
);
COMMENT ON TABLE categories IS 'Product categories';

CREATE TABLE customers (
	id serial PRIMARY KEY,
	name varchar(100) NOT NULL,
	email varchar(150) NOT NULL UNIQUE,
	city varchar(80),
	created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE orders (
	id serial PRIMARY KEY,
	customer_id integer NOT NULL REFERENCES customers (id),
	total_amount numeric(10,2) NOT NULL DEFAULT 0,
	status varchar(50) NOT NULL DEFAULT 'pending',
	tags text[],
	meta jsonb,
	created_at timestamp NOT NULL DEFAULT now()
);
COMMENT ON COLUMN orders.status IS 'pending, processing, shipped, completed or cancelled';
CREATE INDEX orders_status ON orders (status);

CREATE VIEW completed_orders AS SELECT o.id, c.name, o.total_amount FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status = 'completed';

INSERT INTO categories (name, description) VALUES ('Electronics', 'Phones and laptops'), ('Books', NULL), ('Home', 'Kitchen');
INSERT INTO customers (name, email, city) VALUES ('Rahul Sharma', 'rahul@example.com', 'Delhi'), ('Priya Singh', 'priya@example.com', 'Mumbai'), ('Zoë Müller', 'zoe@example.com', NULL);
INSERT INTO orders (customer_id, total_amount, status, tags, meta) VALUES
(1, 299.00, 'pending', '{gift}', '{"source": "web"}'),
(2, 599.50, 'completed', NULL, '{"source": "app", "coupon": "DIWALI"}'),
(3, 149.00, 'shipped', '{express,fragile}', NULL),
(1, 2499.00, 'completed', NULL, NULL);
