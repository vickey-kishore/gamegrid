-- Create Tournament Table
CREATE TABLE tournaments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    logo_path VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL,
    organizer_name VARCHAR(255) NOT NULL,
    organizer_contact VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Tournament Events Table
CREATE TABLE tournament_events (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'Singles', 'Doubles'
    fixture_type VARCHAR(50) NOT NULL, -- 'Knockout', 'League'
    scoring_type VARCHAR(50) NOT NULL, -- '21 Points - Best of 3', '15 Points - Best of 3', '30 Points - Single Set', 'Custom'
    points_per_set INT,
    number_of_sets INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Create Event Participants Table
CREATE TABLE event_participants (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    participant_name VARCHAR(255) NOT NULL, -- "Player Name" or "Player1 / Player2"
    player1_name VARCHAR(255) NOT NULL,
    player2_name VARCHAR(255), -- NULL for Singles
    club_name VARCHAR(255),
    seed_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participant_event FOREIGN KEY (event_id) REFERENCES tournament_events(id) ON DELETE CASCADE
);

-- Create Fixture Matches Table
CREATE TABLE fixture_matches (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    round_number INT NOT NULL,
    match_number INT NOT NULL,
    participant1_id BIGINT,
    participant2_id BIGINT,
    scheduled_time TIMESTAMP,
    court_number VARCHAR(50),
    winner_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_event FOREIGN KEY (event_id) REFERENCES tournament_events(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_participant1 FOREIGN KEY (participant1_id) REFERENCES event_participants(id) ON DELETE SET NULL,
    CONSTRAINT fk_match_participant2 FOREIGN KEY (participant2_id) REFERENCES event_participants(id) ON DELETE SET NULL,
    CONSTRAINT fk_match_winner FOREIGN KEY (winner_id) REFERENCES event_participants(id) ON DELETE SET NULL
);

-- Create optimized Indexes
CREATE INDEX idx_tournament_event_tour ON tournament_events(tournament_id);
CREATE INDEX idx_event_part_event ON event_participants(event_id);
CREATE INDEX idx_fixture_match_event ON fixture_matches(event_id);
CREATE INDEX idx_fixture_match_p1 ON fixture_matches(participant1_id);
CREATE INDEX idx_fixture_match_p2 ON fixture_matches(participant2_id);
CREATE INDEX idx_fixture_match_win ON fixture_matches(winner_id);
CREATE INDEX idx_fixture_match_num ON fixture_matches(match_number);
