CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    gender VARCHAR(20),
    age INT,
    category VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    skill_level VARCHAR(50),
    photo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
