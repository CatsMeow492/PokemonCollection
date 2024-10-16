-- Users Table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255),
    joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_subscribed BOOLEAN DEFAULT FALSE
);

-- Collections Table
CREATE TABLE Collections (
    collection_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    collection_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Items Table
CREATE TABLE Items (
    item_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    edition VARCHAR(100),
    set VARCHAR(100),
    image VARCHAR(255),
    type VARCHAR(50)
);

-- UserItems Table
CREATE TABLE UserItems (
    user_item_id SERIAL PRIMARY KEY,
    collection_id INT NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    grade VARCHAR(50),
    price DECIMAL(10,2),
    quantity INT DEFAULT 1,
    FOREIGN KEY (collection_id) REFERENCES Collections(collection_id),
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
);

-- MarketData Table
CREATE TABLE MarketData (
    market_data_id SERIAL PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL,
    price DECIMAL(10,2),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
);

-- Products Table
CREATE TABLE Products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price VARCHAR(20),
    image VARCHAR(255)
);
