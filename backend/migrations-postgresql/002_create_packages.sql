-- Packages table
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    duration INTEGER NOT NULL,
    quota INTEGER NOT NULL,
    available_quota INTEGER NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    airline VARCHAR(100),
    hotel_makkah VARCHAR(255),
    hotel_madinah VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'bronze',
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_packages_name ON packages(name);
CREATE INDEX idx_packages_departure_date ON packages(departure_date);
CREATE INDEX idx_packages_tier ON packages(tier);
CREATE INDEX idx_packages_is_active ON packages(is_active);
CREATE INDEX idx_packages_available_quota ON packages(available_quota);

-- Trigger for updated_at
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();