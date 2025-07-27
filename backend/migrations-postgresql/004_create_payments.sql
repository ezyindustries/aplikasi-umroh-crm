-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_code VARCHAR(50) UNIQUE,
    jamaah_id UUID NOT NULL REFERENCES jamaah(id),
    package_id UUID NOT NULL REFERENCES packages(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'installment',
    installment_number INTEGER,
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    account_holder VARCHAR(255),
    proof_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_payments_jamaah_id ON payments(jamaah_id);
CREATE INDEX idx_payments_package_id ON payments(package_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate payment code
CREATE OR REPLACE FUNCTION generate_payment_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payment_code := 'PAY' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || LPAD(NEXTVAL('payment_code_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for payment code
CREATE SEQUENCE IF NOT EXISTS payment_code_seq START 1;

-- Trigger for payment code
CREATE TRIGGER generate_payment_code_trigger
    BEFORE INSERT ON payments
    FOR EACH ROW
    WHEN (NEW.payment_code IS NULL)
    EXECUTE FUNCTION generate_payment_code();