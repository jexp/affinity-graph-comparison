CREATE TABLE IF NOT EXISTS product (
	id INT NOT NULL AUTO_INCREMENT,
	uuid VARCHAR(255) NOT NULL,
	url VARCHAR(255) NOT NULL,
	name VARCHAR(255) NOT NULL,
	data TEXT,
	PRIMARY KEY (id)
);

CREATE INDEX product_url ON product ( url );
CREATE INDEX product_uuid ON product ( uuid );
CREATE INDEX product_name ON product ( name );

CREATE TABLE IF NOT EXISTS product_kv (
	id INT NOT NULL AUTO_INCREMENT,
	product_id INT NOT NULL,
	name VARCHAR(255) NOT NULL,
	svalue VARCHAR(255),
	ivalue INT,
	PRIMARY KEY (id)
);

CREATE INDEX product_kv_pid ON product_kv ( product_id );
CREATE INDEX product_kv_key ON product_kv ( name );

CREATE TABLE IF NOT EXISTS affinity (
	id INT NOT NULL AUTO_INCREMENT,
	product_id INT NOT NULL,
	user_id INT NOT NULL,
	relation VARCHAR(255) NOT NULL,
	PRIMARY KEY (id)
);

CREATE INDEX affinity_pid ON affinity ( product_id );
CREATE INDEX affinity_uid ON affinity ( user_id );

CREATE TABLE IF NOT EXISTS user (
	id INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(255) NOT NULL,
	data TEXT,
	PRIMARY KEY (id)
);

CREATE INDEX user_name ON user ( name );

CREATE TABLE IF NOT EXISTS user_kv (
	id INT NOT NULL AUTO_INCREMENT,
	user_id INT NOT NULL,
	name VARCHAR(255) NOT NULL,
	svalue VARCHAR(255),
	ivalue INT,
	PRIMARY KEY (id)
);

CREATE INDEX user_kv_pid ON user_kv ( user_id );
CREATE INDEX user_kv_key ON user_kv ( name );
