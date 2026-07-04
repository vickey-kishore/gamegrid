CREATE TABLE auction_teams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auction_id BIGINT NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    logo_path VARCHAR(255),
    purse_amount DECIMAL(12,2) NOT NULL,
    remaining_purse DECIMAL(12,2) NOT NULL,
    minimum_players INT NOT NULL,
    maximum_players INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    CONSTRAINT uq_auction_team UNIQUE (auction_id, team_name)
);
