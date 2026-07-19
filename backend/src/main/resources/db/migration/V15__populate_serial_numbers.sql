-- Populate serial numbers for existing records using id for ordering
UPDATE auction_players ap1
SET serial_number = (
    SELECT COUNT(*) + 1
    FROM auction_players ap2
    WHERE ap2.auction_id = ap1.auction_id
    AND ap2.id <= ap1.id
)
WHERE ap1.serial_number IS NULL;
