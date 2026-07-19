CREATE TABLE auction_players (
    id BIGSERIAL PRIMARY KEY,
    auction_id BIGINT NOT NULL,
    player_id BIGINT NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available',
    sold_price DECIMAL(12,2),
    team_id BIGINT,
    sold_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES auction_teams(id),
    CONSTRAINT uq_auction_player UNIQUE (auction_id, player_id)
);
