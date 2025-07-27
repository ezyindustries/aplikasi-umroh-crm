-- Jamaah table
CREATE TABLE IF NOT EXISTS jamaah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    birth_place VARCHAR(100),
    gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    address TEXT NOT NULL,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    marital_status VARCHAR(20),
    occupation VARCHAR(100),
    education_level VARCHAR(50),
    blood_type VARCHAR(5),
    passport_number VARCHAR(50) UNIQUE,
    passport_issued_date DATE,
    passport_expiry_date DATE,
    passport_issuing_office VARCHAR(100),
    photo_url VARCHAR(500),
    passport_photo_url VARCHAR(500),
    package_id UUID REFERENCES packages(id),
    mahram_id UUID REFERENCES jamaah(id),
    mahram_name VARCHAR(255),
    mahram_relation VARCHAR(50),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    medical_conditions TEXT,
    medications TEXT,
    umrah_count INTEGER DEFAULT 0,
    hajj_count INTEGER DEFAULT 0,
    last_umrah_year INTEGER,
    last_hajj_year INTEGER,
    status VARCHAR(50) DEFAULT 'registered',
    registration_date DATE DEFAULT CURRENT_DATE,
    departure_status VARCHAR(50),
    room_number VARCHAR(50),
    bus_number VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_jamaah_full_name ON jamaah(full_name);
CREATE INDEX idx_jamaah_nik ON jamaah(nik);
CREATE INDEX idx_jamaah_passport_number ON jamaah(passport_number);
CREATE INDEX idx_jamaah_package_id ON jamaah(package_id);
CREATE INDEX idx_jamaah_status ON jamaah(status);
CREATE INDEX idx_jamaah_registration_date ON jamaah(registration_date);
CREATE INDEX idx_jamaah_phone ON jamaah(phone);

-- Trigger for updated_at
CREATE TRIGGER update_jamaah_updated_at BEFORE UPDATE ON jamaah
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate registration number
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.registration_number := 'JMH' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(NEXTVAL('jamaah_reg_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for registration number
CREATE SEQUENCE IF NOT EXISTS jamaah_reg_seq START 1;

-- Trigger for registration number
CREATE TRIGGER generate_jamaah_registration_number
    BEFORE INSERT ON jamaah
    FOR EACH ROW
    WHEN (NEW.registration_number IS NULL)
    EXECUTE FUNCTION generate_registration_number();