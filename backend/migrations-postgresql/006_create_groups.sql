-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    package_id UUID NOT NULL REFERENCES packages(id),
    leader_id UUID REFERENCES jamaah(id),
    description TEXT,
    departure_date DATE,
    return_date DATE,
    total_members INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Group members junction table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    jamaah_id UUID NOT NULL REFERENCES jamaah(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'member',
    UNIQUE(group_id, jamaah_id)
);

-- Create indexes
CREATE INDEX idx_groups_package_id ON groups(package_id);
CREATE INDEX idx_groups_leader_id ON groups(leader_id);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_jamaah_id ON group_members(jamaah_id);

-- Trigger for updated_at
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate group code
CREATE OR REPLACE FUNCTION generate_group_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.group_code := 'GRP' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || LPAD(NEXTVAL('group_code_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for group code
CREATE SEQUENCE IF NOT EXISTS group_code_seq START 1;

-- Trigger for group code
CREATE TRIGGER generate_group_code_trigger
    BEFORE INSERT ON groups
    FOR EACH ROW
    WHEN (NEW.group_code IS NULL)
    EXECUTE FUNCTION generate_group_code();