CREATE TABLE auctions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auction_name VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    auction_date DATE,
    description TEXT,
    minimum_bid DECIMAL(12,2) NOT NULL,
    bid_increment DECIMAL(12,2) NOT NULL,
    maximum_bid DECIMAL(12,2),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
