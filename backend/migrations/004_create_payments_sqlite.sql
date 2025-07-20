-- SQLite version of payments table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jamaah_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'DP',
    payment_method VARCHAR(50),
    payment_date DATETIME,
    status VARCHAR(50) DEFAULT 'Pending',
    proof_file VARCHAR(255),
    notes TEXT,
    verified_by INTEGER,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- Create trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_payments_updated_at
    AFTER UPDATE ON payments
    FOR EACH ROW
BEGIN
    UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_jamaah_id ON payments(jamaah_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);