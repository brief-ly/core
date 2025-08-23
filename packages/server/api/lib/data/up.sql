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
        nft_token_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS lawyer_jurisdictions (
        account INTEGER REFERENCES account (id) ON DELETE CASCADE ON UPDATE CASCADE,
        jurisdiction TEXT NOT NULL,
        PRIMARY KEY (account, jurisdiction)
    );

CREATE TABLE
    IF NOT EXISTS lawyer_labels (
        account INTEGER REFERENCES account (id) ON DELETE CASCADE ON UPDATE CASCADE,
        label TEXT NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS lawyer_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_name TEXT NOT NULL,
        reasoning TEXT NOT NULL,
        escrow_contract_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS lawyer_group_members (
        group_id INTEGER REFERENCES lawyer_groups (id) ON DELETE CASCADE,
        lawyer_account INTEGER REFERENCES account (id) ON DELETE CASCADE,
        relevance_score REAL NOT NULL,
        role_in_group TEXT NOT NULL,
        PRIMARY KEY (group_id, lawyer_account)
    );

CREATE TABLE
    IF NOT EXISTS group_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_account INTEGER REFERENCES account (id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES lawyer_groups (id) ON DELETE CASCADE,
        current_situation TEXT NOT NULL,
        future_plans TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS group_request_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER REFERENCES group_requests (id) ON DELETE CASCADE,
        lawyer_account INTEGER REFERENCES account (id) ON DELETE CASCADE,
        response TEXT NOT NULL CHECK (response IN ('accepted', 'rejected')),
        responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (request_id, lawyer_account)
    );

CREATE TABLE
    IF NOT EXISTS group_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER REFERENCES lawyer_groups (id) ON DELETE CASCADE,
        lawyer_account INTEGER REFERENCES account (id) ON DELETE CASCADE,
        contract_document_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        document_hash TEXT NOT NULL,
        ipfs_hash TEXT NOT NULL,
        encryption_key TEXT NOT NULL,
        payment_required INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unlocked_at TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS document_access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER REFERENCES group_documents (id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES account (id) ON DELETE CASCADE,
        access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download')),
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS lawyer_verification_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lawyer_account INTEGER REFERENCES account (id) ON DELETE CASCADE,
        document_url TEXT NOT NULL,
        document_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        ipfs_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS group_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER REFERENCES lawyer_groups (id) ON DELETE CASCADE,
        sender_account INTEGER REFERENCES account (id) ON DELETE CASCADE,
        message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'document', 'system')),
        message_content TEXT NOT NULL,
        document_id INTEGER REFERENCES group_documents (id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages (group_id);

CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages (created_at);

CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON group_messages (sender_account);