-- Disposable database for checking the Modern Blue design by hand
-- Load: mysql -uroot < tests/modern-blue-fixture.sql
-- Login through adminer/modern-blue.php (see the comment there), database mb_shop

DROP DATABASE IF EXISTS mb_shop;
CREATE DATABASE mb_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE mb_shop;

CREATE TABLE categories (
	id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(100) NOT NULL,
	description text
) ENGINE=InnoDB;

CREATE TABLE customers (
	id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
	name varchar(100) NOT NULL,
	email varchar(150) NOT NULL UNIQUE,
	city varchar(80) DEFAULT NULL,
	created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
	id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
	category_id int unsigned NOT NULL,
	name varchar(150) NOT NULL,
	price decimal(10,2) NOT NULL DEFAULT 0.00,
	stock int NOT NULL DEFAULT 0,
	FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB;

CREATE TABLE orders (
	id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
	customer_id int unsigned NOT NULL,
	total_amount decimal(10,2) NOT NULL DEFAULT 0.00,
	status varchar(50) NOT NULL DEFAULT 'pending',
	note text,
	created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at datetime DEFAULT NULL,
	FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
	id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
	order_id int unsigned NOT NULL,
	product_id int unsigned NOT NULL,
	quantity int NOT NULL DEFAULT 1,
	unit_price decimal(10,2) NOT NULL,
	FOREIGN KEY (order_id) REFERENCES orders (id),
	FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

CREATE TABLE users (
	id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
	username varchar(60) NOT NULL UNIQUE,
	role enum('admin','editor','viewer') NOT NULL DEFAULT 'viewer',
	last_login datetime DEFAULT NULL
) ENGINE=InnoDB;

INSERT INTO categories (name, description) VALUES
('Electronics', 'Phones, laptops and accessories'), ('Books', NULL), ('Home', 'Kitchen and furniture'), ('Sports', 'Outdoor gear');

INSERT INTO customers (name, email, city) VALUES
('Rahul Sharma', 'rahul@example.com', 'Delhi'), ('Priya Singh', 'priya@example.com', 'Mumbai'),
('Amit Kumar', 'amit@example.com', 'Pune'), ('Sneha Patel', 'sneha@example.com', NULL),
('Zoë Müller', 'zoe@example.com', 'Berlin'), ('Ravi Verma', 'ravi@example.com', 'Jaipur');

INSERT INTO products (category_id, name, price, stock) VALUES
(1, 'Wireless mouse', 299.00, 120), (1, 'USB-C charger', 599.50, 45), (2, 'SQL in a nutshell', 149.00, 12),
(3, 'Coffee mug', 99.00, 300), (4, 'Yoga mat', 399.00, 30), (1, 'Mechanical keyboard', 2499.00, 8);

INSERT INTO orders (customer_id, total_amount, status, note, created_at, updated_at) VALUES
(1, 299.00, 'pending', NULL, '2026-10-18 10:22:11', '2026-10-18 10:22:11'),
(2, 599.50, 'completed', 'Gift wrap', '2026-10-17 14:05:33', '2026-10-17 14:06:10'),
(3, 149.00, 'processing', NULL, '2026-10-16 09:12:44', NULL),
(4, 799.00, 'shipped', 'Leave at the door, the bell does not work and the dog barks loudly at strangers', '2026-10-15 18:44:21', '2026-10-15 18:45:10'),
(5, 399.00, 'cancelled', NULL, '2026-10-14 11:30:05', '2026-10-14 11:30:05'),
(1, 2499.00, 'completed', NULL, '2026-10-13 16:01:00', NULL),
(6, 99.00, 'pending', NULL, '2026-10-12 08:15:42', NULL);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 299.00), (2, 2, 1, 599.50), (3, 3, 1, 149.00), (4, 5, 2, 399.00), (5, 5, 1, 399.00), (6, 6, 1, 2499.00), (7, 4, 1, 99.00);

INSERT INTO users (username, role, last_login) VALUES
('admin', 'admin', '2026-10-19 09:00:00'), ('editor1', 'editor', NULL), ('viewer1', 'viewer', '2026-10-01 12:00:00');
