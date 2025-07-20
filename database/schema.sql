-- Aplikasi Umroh Management Database Schema
-- Created: 2025-07-20
-- Description: Complete database schema for Umroh Management System

-- Create database
CREATE DATABASE umroh_management;
USE umroh_management;

-- 1. Users table for authentication and role management
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_name ENUM('Admin', 'Marketing', 'Keuangan', 'Operator Keberangkatan', 'Tim Visa', 'Tim Ticketing', 'Tim Hotel') NOT NULL DEFAULT 'Marketing',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Packages table for Umroh packages
CREATE TABLE packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    duration INT NOT NULL COMMENT 'Duration in days',
    price DECIMAL(15,2) NOT NULL,
    quota INT NOT NULL,
    booked INT DEFAULT 0,
    remaining_seats INT GENERATED ALWAYS AS (quota - booked) STORED,
    makkah_hotel VARCHAR(100) NOT NULL,
    madinah_hotel VARCHAR(100) NOT NULL,
    makkah_nights INT NOT NULL,
    madinah_nights INT NOT NULL,
    airline VARCHAR(50) NOT NULL,
    flight_number VARCHAR(20),
    transit_city VARCHAR(50),
    description TEXT,
    brochure_image VARCHAR(255),
    status ENUM('active', 'inactive', 'full', 'completed') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_departure_date (departure_date),
    INDEX idx_status (status)
);

-- 3. Jamaah table for pilgrims data
CREATE TABLE jamaah (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    birth_place VARCHAR(50),
    gender ENUM('L', 'P') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT NOT NULL,
    city VARCHAR(50),
    province VARCHAR(50),
    postal_code VARCHAR(10),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    package_id INT,
    mahram_id INT NULL COMMENT 'For women, reference to male guardian',
    medical_notes TEXT,
    is_elderly BOOLEAN DEFAULT FALSE,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verification_notes TEXT,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
    FOREIGN KEY (mahram_id) REFERENCES jamaah(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_nik (nik),
    INDEX idx_package_id (package_id),
    INDEX idx_verification_status (verification_status)
);

-- 4. Documents table for jamaah documents
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jamaah_id INT NOT NULL,
    document_type ENUM('paspor', 'ktp', 'visa', 'vaksin', 'foto', 'kk', 'akta_lahir', 'other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verification_notes TEXT,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    uploaded_by INT,
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_jamaah_id (jamaah_id),
    INDEX idx_document_type (document_type),
    INDEX idx_verification_status (verification_status)
);

-- 5. Payments table for payment records
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    jamaah_id INT NOT NULL,
    package_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('transfer_bank', 'cash', 'credit_card', 'debit_card', 'other') NOT NULL,
    bank_name VARCHAR(50),
    account_number VARCHAR(50),
    reference_number VARCHAR(100),
    receipt_file VARCHAR(255),
    notes TEXT,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verification_notes TEXT,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_jamaah_id (jamaah_id),
    INDEX idx_package_id (package_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_verification_status (verification_status)
);

-- 6. Groups table for departure groups/rombongan
CREATE TABLE groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    package_id INT NOT NULL,
    leader_id INT,
    departure_date DATE NOT NULL,
    return_date DATE,
    max_members INT DEFAULT 45,
    current_members INT DEFAULT 0,
    bus_number VARCHAR(20),
    meeting_point TEXT,
    meeting_time TIME,
    status ENUM('planning', 'active', 'departed', 'completed') DEFAULT 'planning',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    FOREIGN KEY (leader_id) REFERENCES jamaah(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_package_id (package_id),
    INDEX idx_departure_date (departure_date),
    INDEX idx_status (status)
);

-- 7. Group members table (many-to-many relationship)
CREATE TABLE group_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    jamaah_id INT NOT NULL,
    seat_number VARCHAR(10),
    room_number VARCHAR(10),
    room_type ENUM('single', 'double', 'triple', 'quad') DEFAULT 'double',
    roommate_preference TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (jamaah_id) REFERENCES jamaah(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_jamaah (group_id, jamaah_id),
    INDEX idx_group_id (group_id),
    INDEX idx_jamaah_id (jamaah_id)
);

-- 8. Activities log table for audit trail
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at)
);

-- 9. Backups table for backup history
CREATE TABLE backups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    backup_type ENUM('full', 'incremental', 'manual') DEFAULT 'manual',
    status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
);

-- 10. Settings table for application settings
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Notifications table for system notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('jamaah_registered', 'payment_received', 'payment_verified', 'payment_rejected', 
              'document_uploaded', 'document_verified', 'document_rejected', 'package_full', 
              'system_alert', 'info', 'warning', 'error') DEFAULT 'info',
    related_table VARCHAR(50),
    related_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, full_name, role_name, phone) VALUES 
('admin', 'admin@umroh.com', '$2b$10$rQZ9mKzPvVlVRlcUJq7XVOcYbGN.ZGtJ0YqKm4Fm7nYJ6sNd9ABCD', 'Administrator', 'Admin', '081234567890');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description, setting_type, is_public) VALUES
('app_name', 'Aplikasi Umroh Management', 'Application name', 'string', TRUE),
('app_version', '1.0.0', 'Application version', 'string', TRUE),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'number', FALSE),
('allowed_file_types', '["jpg", "jpeg", "png", "pdf", "doc", "docx"]', 'Allowed file types for upload', 'json', FALSE),
('backup_retention_days', '30', 'Number of days to keep backup files', 'number', FALSE),
('email_notifications', 'true', 'Enable email notifications', 'boolean', FALSE),
('jamaah_auto_verify', 'false', 'Auto verify jamaah registration', 'boolean', FALSE);

-- Create views for reporting
CREATE VIEW v_jamaah_summary AS
SELECT 
    j.id,
    j.full_name,
    j.nik,
    j.phone,
    j.email,
    j.verification_status,
    p.name as package_name,
    p.departure_date,
    p.price,
    COALESCE(SUM(pay.amount), 0) as total_paid,
    (p.price - COALESCE(SUM(pay.amount), 0)) as remaining_payment,
    j.created_at
FROM jamaah j
LEFT JOIN packages p ON j.package_id = p.id
LEFT JOIN payments pay ON j.id = pay.jamaah_id AND pay.verification_status = 'verified'
GROUP BY j.id, p.id;

CREATE VIEW v_package_statistics AS
SELECT 
    p.id,
    p.name,
    p.departure_date,
    p.quota,
    p.booked,
    p.remaining_seats,
    p.price,
    (p.booked * p.price) as total_revenue,
    COUNT(DISTINCT j.id) as registered_jamaah,
    COUNT(DISTINCT CASE WHEN j.verification_status = 'verified' THEN j.id END) as verified_jamaah,
    COALESCE(SUM(pay.amount), 0) as total_payments,
    p.status
FROM packages p
LEFT JOIN jamaah j ON p.id = j.package_id
LEFT JOIN payments pay ON j.id = pay.jamaah_id AND pay.verification_status = 'verified'
GROUP BY p.id;

CREATE VIEW v_payment_summary AS
SELECT 
    DATE(payment_date) as payment_date,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_count,
    SUM(CASE WHEN verification_status = 'verified' THEN amount ELSE 0 END) as verified_amount,
    COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_count,
    SUM(CASE WHEN verification_status = 'pending' THEN amount ELSE 0 END) as pending_amount
FROM payments 
GROUP BY DATE(payment_date)
ORDER BY payment_date DESC;

-- Create triggers for automatic updates
DELIMITER //

-- Trigger to update package booked count when jamaah is added
CREATE TRIGGER tr_jamaah_insert AFTER INSERT ON jamaah
FOR EACH ROW
BEGIN
    IF NEW.package_id IS NOT NULL AND NEW.verification_status = 'verified' THEN
        UPDATE packages 
        SET booked = booked + 1 
        WHERE id = NEW.package_id;
    END IF;
END//

-- Trigger to update package booked count when jamaah verification status changes
CREATE TRIGGER tr_jamaah_update AFTER UPDATE ON jamaah
FOR EACH ROW
BEGIN
    -- If verification status changed from verified to something else
    IF OLD.verification_status = 'verified' AND NEW.verification_status != 'verified' AND OLD.package_id IS NOT NULL THEN
        UPDATE packages 
        SET booked = booked - 1 
        WHERE id = OLD.package_id;
    END IF;
    
    -- If verification status changed to verified
    IF OLD.verification_status != 'verified' AND NEW.verification_status = 'verified' AND NEW.package_id IS NOT NULL THEN
        UPDATE packages 
        SET booked = booked + 1 
        WHERE id = NEW.package_id;
    END IF;
    
    -- If package changed for verified jamaah
    IF OLD.verification_status = 'verified' AND NEW.verification_status = 'verified' AND OLD.package_id != NEW.package_id THEN
        -- Decrease old package
        IF OLD.package_id IS NOT NULL THEN
            UPDATE packages 
            SET booked = booked - 1 
            WHERE id = OLD.package_id;
        END IF;
        
        -- Increase new package
        IF NEW.package_id IS NOT NULL THEN
            UPDATE packages 
            SET booked = booked + 1 
            WHERE id = NEW.package_id;
        END IF;
    END IF;
END//

-- Trigger to update package booked count when jamaah is deleted
CREATE TRIGGER tr_jamaah_delete AFTER DELETE ON jamaah
FOR EACH ROW
BEGIN
    IF OLD.package_id IS NOT NULL AND OLD.verification_status = 'verified' THEN
        UPDATE packages 
        SET booked = booked - 1 
        WHERE id = OLD.package_id;
    END IF;
END//

-- Trigger to update group member count
CREATE TRIGGER tr_group_members_insert AFTER INSERT ON group_members
FOR EACH ROW
BEGIN
    UPDATE groups 
    SET current_members = current_members + 1 
    WHERE id = NEW.group_id;
END//

CREATE TRIGGER tr_group_members_delete AFTER DELETE ON group_members
FOR EACH ROW
BEGIN
    UPDATE groups 
    SET current_members = current_members - 1 
    WHERE id = OLD.group_id;
END//

-- Trigger for activity logging
CREATE TRIGGER tr_jamaah_activity_insert AFTER INSERT ON jamaah
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values, ip_address)
    VALUES (@current_user_id, 'INSERT', 'jamaah', NEW.id, JSON_OBJECT(
        'full_name', NEW.full_name,
        'nik', NEW.nik,
        'package_id', NEW.package_id,
        'verification_status', NEW.verification_status
    ), @current_ip);
END//

CREATE TRIGGER tr_jamaah_activity_update AFTER UPDATE ON jamaah
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address)
    VALUES (@current_user_id, 'UPDATE', 'jamaah', NEW.id, 
    JSON_OBJECT(
        'full_name', OLD.full_name,
        'nik', OLD.nik,
        'package_id', OLD.package_id,
        'verification_status', OLD.verification_status
    ),
    JSON_OBJECT(
        'full_name', NEW.full_name,
        'nik', NEW.nik,
        'package_id', NEW.package_id,
        'verification_status', NEW.verification_status
    ), @current_ip);
END//

DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_jamaah_created_at ON jamaah(created_at);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Create stored procedures for common operations
DELIMITER //

-- Procedure to get dashboard statistics
CREATE PROCEDURE sp_get_dashboard_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM jamaah) as total_jamaah,
        (SELECT COUNT(*) FROM jamaah WHERE verification_status = 'verified') as verified_jamaah,
        (SELECT COUNT(*) FROM packages WHERE status = 'active') as active_packages,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE verification_status = 'verified') as total_revenue,
        (SELECT COUNT(*) FROM groups WHERE status = 'departed') as total_departures,
        (SELECT COUNT(*) FROM payments WHERE verification_status = 'pending') as pending_payments;
END//

-- Procedure to verify jamaah and all requirements
CREATE PROCEDURE sp_verify_jamaah(IN jamaah_id INT, IN verifier_id INT, IN notes TEXT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Update jamaah verification status
    UPDATE jamaah 
    SET verification_status = 'verified',
        verification_notes = notes,
        verified_by = verifier_id,
        verified_at = CURRENT_TIMESTAMP
    WHERE id = jamaah_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type, related_table, related_id)
    SELECT created_by, 'Jamaah Terverifikasi', 
           CONCAT('Jamaah ', full_name, ' telah diverifikasi'), 
           'jamaah_verified', 'jamaah', jamaah_id
    FROM jamaah WHERE id = jamaah_id;
    
    COMMIT;
END//

-- Procedure to create backup record
CREATE PROCEDURE sp_create_backup(IN filename VARCHAR(255), IN file_path VARCHAR(500), IN file_size BIGINT, IN user_id INT)
BEGIN
    INSERT INTO backups (filename, file_path, file_size, backup_type, status, created_by)
    VALUES (filename, file_path, file_size, 'manual', 'completed', user_id);
END//

DELIMITER ;

-- Final setup
-- Update package status based on remaining seats
UPDATE packages SET status = 'full' WHERE remaining_seats <= 0 AND status = 'active';

-- Ensure data consistency
UPDATE packages p 
SET booked = (
    SELECT COUNT(*) 
    FROM jamaah j 
    WHERE j.package_id = p.id AND j.verification_status = 'verified'
);

COMMIT;