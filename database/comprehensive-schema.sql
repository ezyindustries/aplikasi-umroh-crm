-- =====================================================
-- SISTEM MANAJEMEN UMROH - DATABASE SCHEMA LENGKAP
-- =====================================================
-- Created for handling 50,000+ jamaah per year
-- Comprehensive structure with audit trails & relationships

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS umroh_management_v2;
CREATE DATABASE umroh_management_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE umroh_management_v2;

-- =====================================================
-- 1. MASTER TABLES
-- =====================================================

-- Master Roles & Permissions
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Master Locations
CREATE TABLE provinces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    province_id INT NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id)
);

CREATE TABLE districts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    city_id INT NOT NULL,
    code VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Master Package Categories
CREATE TABLE package_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Airlines
CREATE TABLE airlines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Hotels
CREATE TABLE hotels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    city ENUM('makkah', 'madinah') NOT NULL,
    star_rating TINYINT CHECK (star_rating BETWEEN 1 AND 5),
    distance_to_haram INT COMMENT 'Distance in meters',
    address TEXT,
    phone VARCHAR(20),
    facilities JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. USER MANAGEMENT
-- =====================================================

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role_id INT NOT NULL,
    profile_picture VARCHAR(255),
    
    -- Security & Session
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMP NULL,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    
    -- Audit
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role_id),
    INDEX idx_active (is_active)
);

-- User Sessions
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_user_expires (user_id, expires_at)
);

-- =====================================================
-- 3. PACKAGE MANAGEMENT
-- =====================================================

CREATE TABLE packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Pricing
    price DECIMAL(15,2) NOT NULL,
    down_payment DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Schedule
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    duration_days INT NOT NULL,
    registration_deadline DATE,
    
    -- Capacity
    max_capacity INT NOT NULL,
    current_bookings INT DEFAULT 0,
    waiting_list_limit INT DEFAULT 0,
    
    -- Accommodation
    makkah_hotel_id INT,
    madinah_hotel_id INT,
    makkah_nights INT NOT NULL,
    madinah_nights INT NOT NULL,
    
    -- Transportation
    airline_id INT,
    departure_airport VARCHAR(10),
    arrival_airport VARCHAR(10),
    
    -- Package Features
    features JSON COMMENT 'Package features and inclusions',
    terms_conditions TEXT,
    
    -- Marketing
    brochure_url VARCHAR(255),
    images JSON COMMENT 'Array of image URLs',
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Status
    status ENUM('draft', 'published', 'full', 'cancelled', 'completed') DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE,
    
    -- Audit
    created_by INT NOT NULL,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES package_categories(id),
    FOREIGN KEY (makkah_hotel_id) REFERENCES hotels(id),
    FOREIGN KEY (madinah_hotel_id) REFERENCES hotels(id),
    FOREIGN KEY (airline_id) REFERENCES airlines(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    INDEX idx_code (code),
    INDEX idx_departure_date (departure_date),
    INDEX idx_status (status),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    INDEX idx_category (category_id)
);

-- Package Addons/Extras
CREATE TABLE package_addons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    max_quantity INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    INDEX idx_package (package_id)
);

-- =====================================================
-- 4. JAMAAH (PILGRIM) MANAGEMENT  
-- =====================================================

CREATE TABLE jamaah (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Registration Info
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    package_id INT NOT NULL,
    
    -- Personal Information
    full_name VARCHAR(200) NOT NULL,
    nik VARCHAR(16) NOT NULL UNIQUE COMMENT 'Indonesian National ID',
    ktp_address TEXT NOT NULL,
    current_address TEXT,
    
    -- Location
    province_id INT,
    city_id INT,
    district_id INT,
    postal_code VARCHAR(10),
    
    -- Demographics
    place_of_birth VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    marital_status ENUM('single', 'married', 'divorced', 'widowed') NOT NULL,
    occupation VARCHAR(100),
    education ENUM('sd', 'smp', 'sma', 'd3', 's1', 's2', 's3', 'lainnya'),
    
    -- Contact Information
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    
    -- Physical Information
    height INT COMMENT 'Height in cm',
    weight INT COMMENT 'Weight in kg',
    blood_type ENUM('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    
    -- Medical Information
    medical_conditions TEXT,
    medications TEXT,
    allergies TEXT,
    dietary_restrictions TEXT,
    mobility_assistance BOOLEAN DEFAULT FALSE,
    
    -- Passport Information
    passport_number VARCHAR(20) UNIQUE,
    passport_issued_date DATE,
    passport_expiry_date DATE,
    passport_issued_place VARCHAR(100),
    passport_photo_url VARCHAR(255),
    
    -- Visa Information
    visa_number VARCHAR(50),
    visa_issued_date DATE,
    visa_expiry_date DATE,
    visa_type VARCHAR(50),
    visa_photo_url VARCHAR(255),
    
    -- Family/Mahram Relations
    is_mahram BOOLEAN DEFAULT FALSE,
    mahram_jamaah_id INT COMMENT 'Reference to mahram if female',
    family_group_code VARCHAR(20) COMMENT 'For grouping families',
    
    -- Accommodation Preferences
    room_preference ENUM('single', 'double', 'triple', 'quad') DEFAULT 'double',
    roommate_request VARCHAR(200),
    special_accommodation_needs TEXT,
    
    -- Financial Information
    total_amount DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    amount_due DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status ENUM('pending', 'partial', 'paid', 'overpaid', 'refunded') DEFAULT 'pending',
    
    -- Status Tracking
    registration_status ENUM('draft', 'submitted', 'verified', 'approved', 'rejected', 'cancelled') DEFAULT 'draft',
    document_status ENUM('incomplete', 'submitted', 'verified', 'approved', 'rejected') DEFAULT 'incomplete',
    visa_status ENUM('not_applied', 'applied', 'in_process', 'approved', 'rejected', 'expired') DEFAULT 'not_applied',
    medical_check_status ENUM('not_done', 'scheduled', 'completed', 'approved', 'rejected') DEFAULT 'not_done',
    
    -- Group Assignment
    group_id INT,
    seat_number VARCHAR(10),
    room_number VARCHAR(20),
    bed_assignment VARCHAR(10),
    
    -- Special Notes
    internal_notes TEXT,
    special_requests TEXT,
    
    -- Registration Source
    registration_source ENUM('online', 'office', 'agent', 'phone', 'referral') DEFAULT 'office',
    referral_code VARCHAR(50),
    agent_id INT,
    
    -- Audit Trail
    registered_by INT NOT NULL,
    verified_by INT,
    approved_by INT,
    cancelled_by INT,
    cancellation_reason TEXT,
    cancellation_date TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (package_id) REFERENCES packages(id),
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (district_id) REFERENCES districts(id),
    FOREIGN KEY (mahram_jamaah_id) REFERENCES jamaah(id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (registered_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (cancelled_by) REFERENCES users(id),
    FOREIGN KEY (agent_id) REFERENCES users(id),
    
    -- Indexes for performance
    INDEX idx_registration_number (registration_number),
    INDEX idx_nik (nik),
    INDEX idx_package (package_id),
    INDEX idx_passport (passport_number),
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_registration_status (registration_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_document_status (document_status),
    INDEX idx_visa_status (visa_status),
    INDEX idx_group (group_id),
    INDEX idx_family_group (family_group_code),
    INDEX idx_created_at (created_at),
    INDEX idx_departure_date (package_id, registration_status),
    
    -- Constraints
    CONSTRAINT chk_age CHECK (DATEDIFF(CURDATE(), date_of_birth) >= 6570), -- At least 18 years old
    CONSTRAINT chk_passport_expiry CHECK (passport_expiry_date IS NULL OR passport_expiry_date > CURDATE()),
    CONSTRAINT chk_amounts CHECK (total_amount >= 0 AND amount_paid >= 0),
    CONSTRAINT chk_phone_format CHECK (phone REGEXP '^[0-9+()-\s]+$')
);

-- Jamaah Status History
CREATE TABLE jamaah_status_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jamaah_id INT NOT NULL,
    status_type ENUM('registration', 'document', 'visa', 'payment', 'medical') NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT NOT NULL,
    reason TEXT,
    notes TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_jamaah_status (jamaah_id, status_type),
    INDEX idx_changed_at (changed_at)
);

-- =====================================================
-- 5. DOCUMENT MANAGEMENT
-- =====================================================

CREATE TABLE document_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    allowed_formats JSON COMMENT 'Array of allowed file formats',
    max_file_size INT COMMENT 'Max file size in KB',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jamaah_id INT NOT NULL,
    document_type_id INT NOT NULL,
    
    -- File Information
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL COMMENT 'Size in bytes',
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) COMMENT 'SHA256 hash for integrity',
    
    -- Document Details
    document_number VARCHAR(100),
    issued_date DATE,
    expiry_date DATE,
    issued_place VARCHAR(100),
    
    -- Status & Verification
    status ENUM('uploaded', 'pending_review', 'approved', 'rejected', 'expired') DEFAULT 'uploaded',
    verification_notes TEXT,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    rejection_reason TEXT,
    
    -- Version Control
    version INT DEFAULT 1,
    previous_document_id INT COMMENT 'Reference to previous version',
    is_current_version BOOLEAN DEFAULT TRUE,
    
    -- Audit
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id) ON DELETE CASCADE,
    FOREIGN KEY (document_type_id) REFERENCES document_types(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (previous_document_id) REFERENCES documents(id),
    
    INDEX idx_jamaah_document (jamaah_id, document_type_id),
    INDEX idx_status (status),
    INDEX idx_expiry (expiry_date),
    INDEX idx_current_version (is_current_version)
);

-- =====================================================
-- 6. PAYMENT MANAGEMENT
-- =====================================================

CREATE TABLE payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('bank_transfer', 'credit_card', 'debit_card', 'cash', 'digital_wallet') NOT NULL,
    provider VARCHAR(100),
    account_number VARCHAR(50),
    account_name VARCHAR(150),
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jamaah_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    
    -- Payment Details
    payment_type ENUM('down_payment', 'installment', 'full_payment', 'addon', 'refund') NOT NULL,
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Banking Details
    bank_name VARCHAR(100),
    account_holder_name VARCHAR(150),
    transfer_date DATE,
    bank_reference VARCHAR(100),
    
    -- Status & Verification
    status ENUM('pending', 'verified', 'approved', 'rejected', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_date TIMESTAMP NULL,
    verification_notes TEXT,
    rejection_reason TEXT,
    
    -- Receipt & Proof
    receipt_url VARCHAR(255),
    proof_of_payment_url VARCHAR(255),
    
    -- Processing
    processed_by INT,
    verified_by INT,
    approved_by INT,
    
    -- Audit
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (processed_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_jamaah_payment (jamaah_id),
    INDEX idx_reference (reference_number),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date),
    INDEX idx_amount (amount)
);

-- Payment Installment Plans
CREATE TABLE payment_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jamaah_id INT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    down_payment DECIMAL(15,2) NOT NULL,
    installment_count INT NOT NULL,
    installment_amount DECIMAL(15,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'completed', 'defaulted', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id),
    INDEX idx_jamaah_plan (jamaah_id),
    INDEX idx_status (status)
);

CREATE TABLE payment_installments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_plan_id INT NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_id INT NULL,
    status ENUM('pending', 'paid', 'late', 'waived') DEFAULT 'pending',
    late_fee DECIMAL(10,2) DEFAULT 0,
    
    FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    INDEX idx_plan_installment (payment_plan_id, installment_number),
    INDEX idx_due_date (due_date)
);

-- =====================================================
-- 7. GROUP MANAGEMENT
-- =====================================================

CREATE TABLE groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT NOT NULL,
    
    -- Group Details
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Capacity
    max_members INT NOT NULL,
    current_members INT DEFAULT 0,
    
    -- Transportation
    bus_number VARCHAR(20),
    bus_capacity INT,
    driver_name VARCHAR(150),
    driver_phone VARCHAR(20),
    
    -- Meeting Details
    meeting_time TIME,
    meeting_point VARCHAR(255),
    meeting_address TEXT,
    departure_terminal VARCHAR(100),
    
    -- Flight Information
    departure_flight VARCHAR(20),
    return_flight VARCHAR(20),
    departure_time DATETIME,
    arrival_time DATETIME,
    
    -- Accommodation
    hotel_check_in DATE,
    hotel_check_out DATE,
    room_allocation_notes TEXT,
    
    -- Status
    status ENUM('planning', 'confirmed', 'departed', 'in_journey', 'returned', 'completed') DEFAULT 'planning',
    
    -- Leadership
    group_leader_jamaah_id INT,
    assistant_leader_jamaah_id INT,
    coordinator_user_id INT,
    
    -- Special Requirements
    special_requirements TEXT,
    dietary_accommodations TEXT,
    medical_notes TEXT,
    
    -- Audit
    created_by INT NOT NULL,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (package_id) REFERENCES packages(id),
    FOREIGN KEY (group_leader_jamaah_id) REFERENCES jamaah(id),
    FOREIGN KEY (assistant_leader_jamaah_id) REFERENCES jamaah(id),
    FOREIGN KEY (coordinator_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    INDEX idx_package_group (package_id),
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_departure_time (departure_time)
);

-- Group Member History
CREATE TABLE group_member_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jamaah_id INT NOT NULL,
    group_id INT NOT NULL,
    action ENUM('added', 'removed', 'transferred') NOT NULL,
    previous_group_id INT,
    reason TEXT,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (previous_group_id) REFERENCES groups(id),
    FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_jamaah_history (jamaah_id),
    INDEX idx_group_history (group_id)
);

-- =====================================================
-- 8. REPORTING & ANALYTICS
-- =====================================================

CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    type ENUM('jamaah', 'financial', 'operational', 'compliance', 'custom') NOT NULL,
    description TEXT,
    sql_query TEXT,
    parameters JSON,
    schedule_cron VARCHAR(100),
    output_format ENUM('pdf', 'excel', 'csv', 'html') DEFAULT 'excel',
    recipients JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_type (type),
    INDEX idx_schedule (schedule_cron)
);

CREATE TABLE report_executions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    executed_by INT NOT NULL,
    parameters_used JSON,
    execution_time DECIMAL(8,3) COMMENT 'Execution time in seconds',
    status ENUM('running', 'completed', 'failed') DEFAULT 'running',
    error_message TEXT,
    output_file_path VARCHAR(500),
    row_count INT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (report_id) REFERENCES reports(id),
    FOREIGN KEY (executed_by) REFERENCES users(id),
    INDEX idx_report_execution (report_id, executed_at),
    INDEX idx_status (status)
);

-- =====================================================
-- 9. AUDIT & LOGGING
-- =====================================================

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_fields JSON,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at),
    
    -- Partition by month for performance
    PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
        PARTITION p202401 VALUES LESS THAN (202402),
        PARTITION p202402 VALUES LESS THAN (202403),
        PARTITION p202403 VALUES LESS THAN (202404),
        PARTITION p202404 VALUES LESS THAN (202405),
        PARTITION p202405 VALUES LESS THAN (202406),
        PARTITION p202406 VALUES LESS THAN (202407),
        PARTITION p202407 VALUES LESS THAN (202408),
        PARTITION p202408 VALUES LESS THAN (202409),
        PARTITION p202409 VALUES LESS THAN (202410),
        PARTITION p202410 VALUES LESS THAN (202411),
        PARTITION p202411 VALUES LESS THAN (202412),
        PARTITION p202412 VALUES LESS THAN (202501),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    )
);

CREATE TABLE system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    level ENUM('ERROR', 'WARNING', 'INFO', 'DEBUG') NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    context JSON,
    user_id INT,
    ip_address VARCHAR(45),
    file_name VARCHAR(255),
    line_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_level_category (level, category),
    INDEX idx_created_at (created_at),
    INDEX idx_user_logs (user_id, created_at)
);

-- =====================================================
-- 10. NOTIFICATIONS & COMMUNICATIONS
-- =====================================================

CREATE TABLE notification_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('email', 'sms', 'whatsapp', 'push') NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSON COMMENT 'Available template variables',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id INT,
    user_id INT,
    jamaah_id INT,
    
    -- Message Details
    type ENUM('email', 'sms', 'whatsapp', 'push', 'system') NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Status
    status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    error_message TEXT,
    
    -- Tracking
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    
    -- Priority
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    scheduled_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES notification_templates(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id),
    
    INDEX idx_recipient_status (recipient, status),
    INDEX idx_type_status (type, status),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_created (created_at)
);

-- =====================================================
-- 11. CONFIGURATION & SETTINGS
-- =====================================================

CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    value TEXT,
    data_type ENUM('string', 'integer', 'decimal', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE KEY uk_category_key (category, key_name),
    INDEX idx_category (category),
    INDEX idx_public (is_public)
);

-- =====================================================
-- 12. BACKUP & MAINTENANCE
-- =====================================================

CREATE TABLE backup_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    backup_type ENUM('full', 'incremental', 'differential') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64),
    compression_type VARCHAR(20),
    status ENUM('started', 'completed', 'failed') NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT,
    created_by INT,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_type_status (backup_type, status),
    INDEX idx_started_at (started_at)
);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- INITIAL DATA POPULATION
-- =====================================================

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Administrator', 'Full system access', '["*"]'),
('admin', 'Administrator', 'Full administrative access', '["users.*", "jamaah.*", "packages.*", "reports.*"]'),
('manager', 'Manager', 'Management level access', '["jamaah.read", "jamaah.update", "packages.read", "reports.read"]'),
('marketing', 'Marketing', 'Marketing and registration', '["jamaah.create", "jamaah.read", "jamaah.update", "packages.read"]'),
('finance', 'Finance', 'Financial operations', '["payments.*", "jamaah.read", "reports.financial"]'),
('visa_officer', 'Visa Officer', 'Visa processing', '["jamaah.read", "jamaah.update", "documents.*", "visa.*"]'),
('group_coordinator', 'Group Coordinator', 'Group management', '["groups.*", "jamaah.read", "jamaah.update"]'),
('operator', 'Operator', 'Basic operations', '["jamaah.read", "groups.read", "documents.read"]');

-- Insert sample provinces (Indonesia)
INSERT INTO provinces (code, name) VALUES
('11', 'Aceh'),
('12', 'Sumatera Utara'),
('13', 'Sumatera Barat'),
('31', 'DKI Jakarta'),
('32', 'Jawa Barat'),
('33', 'Jawa Tengah'),
('34', 'DI Yogyakarta'),
('35', 'Jawa Timur'),
('51', 'Bali'),
('73', 'Sulawesi Selatan');

-- Insert package categories
INSERT INTO package_categories (name, description, sort_order) VALUES
('Reguler', 'Paket umroh reguler dengan fasilitas standar', 1),
('Plus', 'Paket umroh plus dengan fasilitas tambahan', 2),
('Premium', 'Paket umroh premium dengan fasilitas mewah', 3),
('VIP', 'Paket umroh VIP dengan layanan eksklusif', 4),
('Ramadhan', 'Paket khusus bulan Ramadhan', 5),
('Haji Plus', 'Paket kombinasi umroh dan haji', 6);

-- Insert sample airlines
INSERT INTO airlines (code, name) VALUES
('GA', 'Garuda Indonesia'),
('SJ', 'Sriwijaya Air'),
('EK', 'Emirates'),
('QR', 'Qatar Airways'),
('EY', 'Etihad Airways'),
('MS', 'EgyptAir');

-- Insert sample hotels
INSERT INTO hotels (name, city, star_rating, distance_to_haram, address) VALUES
('Hilton Makkah Convention Hotel', 'makkah', 5, 500, 'King Abdul Aziz Road, Makkah'),
('Pullman Zamzam Makkah', 'makkah', 5, 200, 'Abraj Al-Bait Complex, Makkah'),
('Conrad Makkah', 'makkah', 5, 300, 'Makkah Clock Royal Tower, Makkah'),
('Shaza Madinah', 'madinah', 5, 100, 'King Fahd Road, Madinah'),
('Pullman Madinah', 'madinah', 5, 150, 'Al Haram Area, Madinah'),
('Crowne Plaza Madinah', 'madinah', 5, 200, 'King Abdul Aziz Road, Madinah');

-- Insert document types
INSERT INTO document_types (name, description, allowed_formats, max_file_size, is_mandatory) VALUES
('KTP', 'Kartu Tanda Penduduk', '["jpg", "jpeg", "png", "pdf"]', 2048, true),
('Kartu Keluarga', 'Kartu Keluarga', '["jpg", "jpeg", "png", "pdf"]', 2048, true),
('Paspor', 'Paspor', '["jpg", "jpeg", "png", "pdf"]', 2048, true),
('Foto 4x6', 'Foto ukuran 4x6 cm', '["jpg", "jpeg", "png"]', 1024, true),
('Akta Kelahiran', 'Akta Kelahiran', '["jpg", "jpeg", "png", "pdf"]', 2048, true),
('Surat Nikah/Cerai', 'Surat Nikah atau Surat Cerai', '["jpg", "jpeg", "png", "pdf"]', 2048, false),
('Surat Izin Suami', 'Surat Izin Suami untuk jamaah wanita', '["jpg", "jpeg", "png", "pdf"]', 2048, false),
('Surat Keterangan Sehat', 'Surat Keterangan Sehat dari Dokter', '["jpg", "jpeg", "png", "pdf"]', 2048, true),
('Buku Vaksin', 'Buku Vaksinasi (Meningitis, dll)', '["jpg", "jpeg", "png", "pdf"]', 2048, true);

-- Insert payment methods
INSERT INTO payment_methods (name, type, provider, account_number, account_name, instructions) VALUES
('BCA Transfer', 'bank_transfer', 'Bank Central Asia', '1234567890', 'PT. Umroh Mandiri', 'Transfer ke rekening BCA dan upload bukti transfer'),
('Mandiri Transfer', 'bank_transfer', 'Bank Mandiri', '9876543210', 'PT. Umroh Mandiri', 'Transfer ke rekening Mandiri dan upload bukti transfer'),
('BNI Transfer', 'bank_transfer', 'Bank Negara Indonesia', '5555666677', 'PT. Umroh Mandiri', 'Transfer ke rekening BNI dan upload bukti transfer'),
('Cash', 'cash', NULL, NULL, NULL, 'Pembayaran tunai di kantor'),
('Credit Card', 'credit_card', 'Multiple', NULL, NULL, 'Pembayaran dengan kartu kredit');

-- Insert notification templates
INSERT INTO notification_templates (name, type, subject, content, variables) VALUES
('welcome_email', 'email', 'Selamat Datang di Sistem Umroh', 
 'Halo {{jamaah_name}}, selamat datang! Registrasi Anda dengan nomor {{registration_number}} telah berhasil.', 
 '["jamaah_name", "registration_number"]'),
('payment_reminder', 'email', 'Pengingat Pembayaran', 
 'Halo {{jamaah_name}}, ini pengingat bahwa pembayaran Anda jatuh tempo pada {{due_date}}.', 
 '["jamaah_name", "due_date", "amount"]'),
('document_approved', 'email', 'Dokumen Disetujui', 
 'Halo {{jamaah_name}}, dokumen {{document_type}} Anda telah disetujui.', 
 '["jamaah_name", "document_type"]'),
('departure_reminder', 'email', 'Pengingat Keberangkatan', 
 'Halo {{jamaah_name}}, keberangkatan Anda dijadwalkan pada {{departure_date}}. Detail: {{meeting_point}} pukul {{meeting_time}}.', 
 '["jamaah_name", "departure_date", "meeting_point", "meeting_time"]');

-- Insert system settings
INSERT INTO system_settings (category, key_name, value, data_type, description) VALUES
('general', 'company_name', 'PT. Umroh Mandiri', 'string', 'Nama perusahaan'),
('general', 'company_address', 'Jl. Merdeka No. 123, Jakarta', 'string', 'Alamat perusahaan'),
('general', 'company_phone', '021-12345678', 'string', 'Telepon perusahaan'),
('general', 'company_email', 'info@umrohmandiri.com', 'string', 'Email perusahaan'),
('registration', 'min_age', '17', 'integer', 'Usia minimum jamaah (tahun)'),
('registration', 'max_age', '75', 'integer', 'Usia maksimum jamaah (tahun)'),
('payment', 'min_down_payment', '5000000', 'integer', 'Minimum uang muka (IDR)'),
('payment', 'payment_deadline_days', '30', 'integer', 'Batas waktu pelunasan (hari)'),
('notification', 'reminder_days_before', '7,3,1', 'string', 'Hari pengingat sebelum keberangkatan'),
('system', 'backup_retention_days', '30', 'integer', 'Lama penyimpanan backup (hari)'),
('system', 'session_timeout_minutes', '480', 'integer', 'Timeout sesi (menit)');

-- Create default super admin user
INSERT INTO users (username, email, password_hash, full_name, phone, role_id, created_by) VALUES
('superadmin', 'admin@umrohmandiri.com', '$2b$10$rGZz9QnJ8.5H6mO3L7Kx9eF8vY9wN2pA5tR7uI1oP3qS4dF6gH8jK', 
 'Super Administrator', '081234567890', 1, 1);

COMMIT;

-- =====================================================
-- END OF SCHEMA
-- =====================================================