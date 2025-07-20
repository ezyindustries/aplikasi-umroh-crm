-- SQLite version of packages table
CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    capacity INTEGER NOT NULL,
    occupied INTEGER DEFAULT 0,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_packages_updated_at
    AFTER UPDATE ON packages
    FOR EACH ROW
BEGIN
    UPDATE packages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_departure_date ON packages(departure_date);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);