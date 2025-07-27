-- CRM Tables for Marketing Dashboard and WhatsApp Bot

-- Lead Sources
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, website, referral, social_media
    channel_id VARCHAR(255), -- WhatsApp number or other channel ID
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leads (Prospective Customers)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_number VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated LEAD-YYYYMMDD-XXXX
    name VARCHAR(255),
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    city VARCHAR(100),
    source_id UUID REFERENCES lead_sources(id),
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, negotiation, won, lost
    interest_level INTEGER DEFAULT 0, -- 0-10 scale
    interested_package_id UUID REFERENCES packages(id),
    estimated_departure DATE,
    budget_range VARCHAR(50),
    notes TEXT,
    assigned_to UUID REFERENCES users(id),
    first_contact_at TIMESTAMP WITH TIME ZONE,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    converted_to_jamaah_id UUID REFERENCES jamaah(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    lost_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Tags for categorization
CREATE TABLE IF NOT EXISTS lead_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship for leads and tags
CREATE TABLE IF NOT EXISTS lead_tag_relations (
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES lead_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (lead_id, tag_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Conversations
CREATE TABLE IF NOT EXISTS wa_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    jamaah_id UUID REFERENCES jamaah(id),
    phone_number VARCHAR(20) NOT NULL,
    wa_session_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, ended, bot_handled, human_handled
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    total_messages INTEGER DEFAULT 0,
    ai_handled_messages INTEGER DEFAULT 0,
    human_handled_messages INTEGER DEFAULT 0,
    satisfaction_score INTEGER, -- 1-5 rating
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS wa_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES wa_conversations(id) ON DELETE CASCADE,
    wa_message_id VARCHAR(255) UNIQUE,
    direction VARCHAR(10) NOT NULL, -- inbound, outbound
    type VARCHAR(50) DEFAULT 'text', -- text, image, document, audio, video, location
    content TEXT,
    media_url TEXT,
    status VARCHAR(50), -- sent, delivered, read, failed
    is_from_bot BOOLEAN DEFAULT false,
    bot_confidence DECIMAL(3,2), -- 0.00 to 1.00
    intent_detected VARCHAR(100), -- greeting, inquiry, complaint, booking, etc
    handled_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- AI Bot Templates
CREATE TABLE IF NOT EXISTS bot_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- greeting, faq, package_info, booking, followup
    trigger_keywords TEXT[], -- Array of keywords that trigger this template
    response_template TEXT NOT NULL,
    variables JSONB, -- Dynamic variables like {name}, {package}, etc
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Bot Configuration
CREATE TABLE IF NOT EXISTS bot_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bot Learning Data (for improving responses)
CREATE TABLE IF NOT EXISTS bot_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES wa_messages(id),
    user_input TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    was_helpful BOOLEAN,
    user_feedback TEXT,
    corrected_response TEXT,
    learned_intent VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- broadcast, drip, trigger_based
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, running, paused, completed
    target_audience JSONB, -- Criteria for selecting leads
    message_template_id UUID REFERENCES message_templates(id),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    responses_received INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, read, responded, converted
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    message_id UUID REFERENCES wa_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Activities (for tracking all interactions)
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- call, whatsapp, email, meeting, note, status_change
    description TEXT,
    metadata JSONB,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketing Metrics (for dashboard)
CREATE TABLE IF NOT EXISTS marketing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- leads_generated, conversations, conversions, revenue
    metric_value DECIMAL(15,2) NOT NULL,
    source VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, metric_type, source)
);

-- Create indexes for performance
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_wa_conversations_phone ON wa_conversations(phone_number);
CREATE INDEX idx_wa_messages_conversation ON wa_messages(conversation_id);
CREATE INDEX idx_wa_messages_created_at ON wa_messages(created_at);
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_marketing_metrics_date ON marketing_metrics(date);

-- Create sequence for lead number
CREATE SEQUENCE IF NOT EXISTS lead_number_seq START 1;

-- Function to generate lead number
CREATE OR REPLACE FUNCTION generate_lead_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
BEGIN
    new_number := 'LEAD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('lead_number_seq')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate lead number
CREATE OR REPLACE FUNCTION trigger_generate_lead_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lead_number IS NULL THEN
        NEW.lead_number := generate_lead_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_lead_number
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_lead_number();

-- Insert default bot configuration
INSERT INTO bot_config (parameter, value, description) VALUES
('greeting_message', 'Assalamualaikum! Selamat datang di Vauza Tamma Travel. Saya adalah asisten virtual yang siap membantu Anda. Silakan ketik angka sesuai kebutuhan:
1. Info Paket Umroh
2. Jadwal Keberangkatan
3. Cara Pendaftaran
4. Konsultasi dengan Tim', 'Pesan sambutan awal'),
('response_delay', '2000', 'Delay dalam milidetik sebelum bot merespons'),
('confidence_threshold', '0.7', 'Minimum confidence untuk bot merespons otomatis'),
('office_hours', '08:00-17:00', 'Jam kerja untuk respons manual'),
('escalation_keywords', 'komplain,urgent,penting,masalah,bantuan', 'Kata kunci untuk eskalasi ke human'),
('max_bot_attempts', '3', 'Maksimal percobaan bot sebelum eskalasi'),
('llm_model', 'gpt-3.5-turbo', 'Model LLM yang digunakan'),
('llm_temperature', '0.7', 'Temperature untuk LLM response'),
('llm_max_tokens', '150', 'Maximum tokens untuk response')
ON CONFLICT (parameter) DO NOTHING;

-- Insert default bot templates
INSERT INTO bot_templates (name, category, trigger_keywords, response_template) VALUES
('Salam', 'greeting', ARRAY['assalamualaikum', 'halo', 'hai', 'pagi', 'siang', 'sore', 'malam'], 
'Waalaikumsalam {greeting}! Terima kasih telah menghubungi Vauza Tamma Travel. Ada yang bisa saya bantu hari ini?'),

('Info Paket', 'package_info', ARRAY['paket', 'harga', 'biaya', 'program'], 
'Kami memiliki beberapa paket umroh yang bisa dipilih:
✈️ Paket Reguler 12 Hari - Mulai 25 Juta
✈️ Paket Plus Turki 15 Hari - Mulai 35 Juta
✈️ Paket VIP 9 Hari - Mulai 45 Juta

Untuk info detail, silakan ketik nama paket yang Anda minati.'),

('Jadwal', 'faq', ARRAY['jadwal', 'keberangkatan', 'berangkat', 'kapan'],
'Jadwal keberangkatan terdekat kami:
📅 Maret 2025 - Paket Reguler (Kuota: 20 tersisa)
📅 April 2025 - Paket Plus Turki (Kuota: 15 tersisa)
📅 Mei 2025 - Paket VIP (Kuota: 10 tersisa)

Apakah ada bulan tertentu yang Anda inginkan?'),

('Pendaftaran', 'faq', ARRAY['daftar', 'pendaftaran', 'cara', 'syarat'],
'Untuk mendaftar umroh di Vauza Tamma Travel:

📋 Syarat Dokumen:
- KTP
- Paspor (masa berlaku min. 7 bulan)
- Pas foto 4x6 (5 lembar)
- Kartu Keluarga
- Buku Nikah (jika sudah menikah)

💰 Pembayaran:
- DP minimal 10 juta
- Pelunasan H-30

Apakah Anda ingin saya buatkan janji temu untuk pendaftaran?'),

('Terima Kasih', 'closing', ARRAY['terima kasih', 'makasih', 'thanks'],
'Sama-sama! Senang bisa membantu Anda. Jika ada pertanyaan lain, jangan ragu untuk menghubungi kami kembali. Semoga Allah mudahkan perjalanan ibadah Anda. 🕋')
ON CONFLICT (name) DO NOTHING;

-- Insert sample lead sources
INSERT INTO lead_sources (name, type, channel_id) VALUES
('WhatsApp Business', 'whatsapp', '+6281234567890'),
('Website Form', 'website', 'https://vauzatamma.com'),
('Instagram', 'social_media', '@vauzatamma'),
('Referral Program', 'referral', 'REF001')
ON CONFLICT DO NOTHING;

-- Insert sample lead tags
INSERT INTO lead_tags (name, color, description) VALUES
('Hot Lead', '#EF4444', 'Sangat berminat, prioritas tinggi'),
('Repeat Customer', '#10B981', 'Pelanggan yang sudah pernah berangkat'),
('Family Package', '#3B82F6', 'Tertarik paket keluarga'),
('Budget Conscious', '#F59E0B', 'Sensitif terhadap harga')
ON CONFLICT (name) DO NOTHING;