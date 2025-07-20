-- SQLite version of jamaah table
CREATE TABLE IF NOT EXISTS jamaah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(255) NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    passport_number VARCHAR(50) UNIQUE,
    birth_date DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    package_id INTEGER,
    status VARCHAR(50) DEFAULT 'Terdaftar',
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id)
);

-- Create trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_jamaah_updated_at
    AFTER UPDATE ON jamaah
    FOR EACH ROW
BEGIN
    UPDATE jamaah SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jamaah_nik ON jamaah(nik);
CREATE INDEX IF NOT EXISTS idx_jamaah_passport ON jamaah(passport_number);
CREATE INDEX IF NOT EXISTS idx_jamaah_package_id ON jamaah(package_id);
CREATE INDEX IF NOT EXISTS idx_jamaah_status ON jamaah(status);
CREATE INDEX IF NOT EXISTS idx_jamaah_full_name ON jamaah(full_name);