ALTER TABLE auction_players ADD COLUMN serial_number INTEGER;

-- Populate serial numbers for existing records using id for ordering
UPDATE auction_players ap1
SET serial_number = (
    SELECT COUNT(*) + 1
    FROM auction_players ap2
    WHERE ap2.auction_id = ap1.auction_id
    AND ap2.id <= ap1.id
);

-- Create index on serial_number for faster searches
CREATE INDEX idx_auction_players_serial_number ON auction_players(serial_number);

-- Create composite index for auction + serial_number queries
CREATE INDEX idx_auction_players_auction_serial ON auction_players(auction_id, serial_number);
