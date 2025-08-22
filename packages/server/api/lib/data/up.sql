-- migrations file for sqlite database
CREATE TABLE
    IF NOT EXISTS account (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS lawyer_accounts (
        account INTEGER PRIMARY KEY REFERENCES account (id) ON DELETE CASCADE ON UPDATE CASCADE,
        name TEXT NOT NULL,
        photo_url TEXT NOT NULL,
        bio TEXT NOT NULL,
        expertise TEXT NOT NULL,
        consultation_fee INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS lawyer_jurisdictions (
        account INTEGER PRIMARY KEY REFERENCES account (id) ON DELETE CASCADE ON UPDATE CASCADE,
        jurisdiction TEXT NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS lawyer_labels (
        account INTEGER REFERENCES account (id) ON DELETE CASCADE ON UPDATE CASCADE,
        label TEXT NOT NULL
    )