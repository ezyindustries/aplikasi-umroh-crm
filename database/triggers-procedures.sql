-- =====================================================
-- TRIGGERS & STORED PROCEDURES
-- =====================================================
-- Advanced automation for Umroh Management System

USE umroh_management_v2;

DELIMITER $$

-- =====================================================
-- TRIGGERS FOR AUDIT LOGGING
-- =====================================================

-- Jamaah audit trigger
CREATE TRIGGER tr_jamaah_audit_insert
AFTER INSERT ON jamaah
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id, created_at)
    VALUES ('jamaah', NEW.id, 'INSERT', JSON_OBJECT(
        'registration_number', NEW.registration_number,
        'full_name', NEW.full_name,
        'nik', NEW.nik,
        'package_id', NEW.package_id,
        'registration_status', NEW.registration_status
    ), NEW.registered_by, NOW());
END$$

CREATE TRIGGER tr_jamaah_audit_update
AFTER UPDATE ON jamaah
FOR EACH ROW
BEGIN
    DECLARE changed_fields JSON DEFAULT JSON_ARRAY();
    
    IF OLD.registration_status != NEW.registration_status THEN
        SET changed_fields = JSON_ARRAY_APPEND(changed_fields, '$', 'registration_status');
    END IF;
    IF OLD.payment_status != NEW.payment_status THEN
        SET changed_fields = JSON_ARRAY_APPEND(changed_fields, '$', 'payment_status');
    END IF;
    IF OLD.document_status != NEW.document_status THEN
        SET changed_fields = JSON_ARRAY_APPEND(changed_fields, '$', 'document_status');
    END IF;
    IF OLD.visa_status != NEW.visa_status THEN
        SET changed_fields = JSON_ARRAY_APPEND(changed_fields, '$', 'visa_status');
    END IF;
    
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_fields, user_id, created_at)
    VALUES ('jamaah', NEW.id, 'UPDATE', 
        JSON_OBJECT('registration_status', OLD.registration_status, 'payment_status', OLD.payment_status),
        JSON_OBJECT('registration_status', NEW.registration_status, 'payment_status', NEW.payment_status),
        changed_fields, NEW.registered_by, NOW());
END$$

-- Payment processing trigger
CREATE TRIGGER tr_payment_update_jamaah
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(15,2) DEFAULT 0;
    DECLARE total_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE new_payment_status VARCHAR(20);
    
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Calculate total paid for this jamaah
        SELECT COALESCE(SUM(amount), 0) INTO total_paid
        FROM payments 
        WHERE jamaah_id = NEW.jamaah_id AND status = 'approved';
        
        -- Get total amount required
        SELECT j.total_amount INTO total_amount
        FROM jamaah j WHERE j.id = NEW.jamaah_id;
        
        -- Determine payment status
        IF total_paid = 0 THEN
            SET new_payment_status = 'pending';
        ELSEIF total_paid < total_amount THEN
            SET new_payment_status = 'partial';
        ELSEIF total_paid = total_amount THEN
            SET new_payment_status = 'paid';
        ELSEIF total_paid > total_amount THEN
            SET new_payment_status = 'overpaid';
        END IF;
        
        -- Update jamaah payment status and amount
        UPDATE jamaah 
        SET amount_paid = total_paid, 
            payment_status = new_payment_status,
            updated_at = NOW()
        WHERE id = NEW.jamaah_id;
    END IF;
END$$

-- Package capacity management
CREATE TRIGGER tr_jamaah_package_capacity
AFTER INSERT ON jamaah
FOR EACH ROW
BEGIN
    UPDATE packages 
    SET current_bookings = current_bookings + 1,
        updated_at = NOW()
    WHERE id = NEW.package_id;
    
    -- Check if package is full
    UPDATE packages 
    SET status = 'full'
    WHERE id = NEW.package_id 
    AND current_bookings >= max_capacity 
    AND status = 'published';
END$$

-- Group member count trigger
CREATE TRIGGER tr_group_member_count
AFTER UPDATE ON jamaah
FOR EACH ROW
BEGIN
    -- Update old group count
    IF OLD.group_id IS NOT NULL AND OLD.group_id != NEW.group_id THEN
        UPDATE groups 
        SET current_members = current_members - 1,
            updated_at = NOW()
        WHERE id = OLD.group_id;
    END IF;
    
    -- Update new group count
    IF NEW.group_id IS NOT NULL AND OLD.group_id != NEW.group_id THEN
        UPDATE groups 
        SET current_members = current_members + 1,
            updated_at = NOW()
        WHERE id = NEW.group_id;
    END IF;
END$$

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure to register new jamaah with validation
CREATE PROCEDURE sp_register_jamaah(
    IN p_package_id INT,
    IN p_full_name VARCHAR(200),
    IN p_nik VARCHAR(16),
    IN p_date_of_birth DATE,
    IN p_gender ENUM('male', 'female'),
    IN p_phone VARCHAR(20),
    IN p_email VARCHAR(100),
    IN p_registered_by INT,
    OUT p_registration_number VARCHAR(50),
    OUT p_jamaah_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_age INT;
    DECLARE v_package_available INT DEFAULT 0;
    DECLARE v_nik_exists INT DEFAULT 0;
    DECLARE v_min_age INT DEFAULT 17;
    DECLARE v_max_age INT DEFAULT 75;
    DECLARE v_package_price DECIMAL(15,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_message = 'Database error occurred during registration';
    END;
    
    START TRANSACTION;
    
    -- Get system settings
    SELECT value INTO v_min_age FROM system_settings WHERE category = 'registration' AND key_name = 'min_age';
    SELECT value INTO v_max_age FROM system_settings WHERE category = 'registration' AND key_name = 'max_age';
    
    -- Validate age
    SET v_age = TIMESTAMPDIFF(YEAR, p_date_of_birth, CURDATE());
    IF v_age < v_min_age THEN
        SET p_result_code = 1;
        SET p_result_message = CONCAT('Usia minimal ', v_min_age, ' tahun');
        ROLLBACK;
        LEAVE sp_register_jamaah;
    END IF;
    
    IF v_age > v_max_age THEN
        SET p_result_code = 2;
        SET p_result_message = CONCAT('Usia maksimal ', v_max_age, ' tahun');
        ROLLBACK;
        LEAVE sp_register_jamaah;
    END IF;
    
    -- Check if NIK already exists
    SELECT COUNT(*) INTO v_nik_exists FROM jamaah WHERE nik = p_nik;
    IF v_nik_exists > 0 THEN
        SET p_result_code = 3;
        SET p_result_message = 'NIK sudah terdaftar';
        ROLLBACK;
        LEAVE sp_register_jamaah;
    END IF;
    
    -- Check package availability
    SELECT COUNT(*) INTO v_package_available 
    FROM packages 
    WHERE id = p_package_id 
    AND status = 'published' 
    AND current_bookings < max_capacity
    AND departure_date > CURDATE();
    
    IF v_package_available = 0 THEN
        SET p_result_code = 4;
        SET p_result_message = 'Paket tidak tersedia atau sudah penuh';
        ROLLBACK;
        LEAVE sp_register_jamaah;
    END IF;
    
    -- Get package price
    SELECT price INTO v_package_price FROM packages WHERE id = p_package_id;
    
    -- Generate registration number
    SET p_registration_number = CONCAT(
        'UMR', 
        YEAR(CURDATE()), 
        LPAD(MONTH(CURDATE()), 2, '0'),
        LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM jamaah), 6, '0')
    );
    
    -- Insert jamaah
    INSERT INTO jamaah (
        registration_number, package_id, full_name, nik, date_of_birth, 
        gender, phone, email, total_amount, registered_by
    ) VALUES (
        p_registration_number, p_package_id, p_full_name, p_nik, p_date_of_birth,
        p_gender, p_phone, p_email, v_package_price, p_registered_by
    );
    
    SET p_jamaah_id = LAST_INSERT_ID();
    SET p_result_code = 0;
    SET p_result_message = 'Registrasi berhasil';
    
    COMMIT;
END$$

-- Procedure to process payment
CREATE PROCEDURE sp_process_payment(
    IN p_jamaah_id INT,
    IN p_payment_method_id INT,
    IN p_amount DECIMAL(15,2),
    IN p_reference_number VARCHAR(100),
    IN p_bank_name VARCHAR(100),
    IN p_processed_by INT,
    OUT p_payment_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_jamaah_exists INT DEFAULT 0;
    DECLARE v_ref_exists INT DEFAULT 0;
    DECLARE v_total_amount DECIMAL(15,2);
    DECLARE v_amount_paid DECIMAL(15,2);
    DECLARE v_remaining DECIMAL(15,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_message = 'Database error occurred during payment processing';
    END;
    
    START TRANSACTION;
    
    -- Check if jamaah exists
    SELECT COUNT(*), total_amount, amount_paid 
    INTO v_jamaah_exists, v_total_amount, v_amount_paid
    FROM jamaah WHERE id = p_jamaah_id;
    
    IF v_jamaah_exists = 0 THEN
        SET p_result_code = 1;
        SET p_result_message = 'Jamaah tidak ditemukan';
        ROLLBACK;
        LEAVE sp_process_payment;
    END IF;
    
    -- Check if reference number already exists
    SELECT COUNT(*) INTO v_ref_exists FROM payments WHERE reference_number = p_reference_number;
    IF v_ref_exists > 0 THEN
        SET p_result_code = 2;
        SET p_result_message = 'Nomor referensi sudah ada';
        ROLLBACK;
        LEAVE sp_process_payment;
    END IF;
    
    -- Check if amount is valid
    SET v_remaining = v_total_amount - v_amount_paid;
    IF p_amount <= 0 THEN
        SET p_result_code = 3;
        SET p_result_message = 'Jumlah pembayaran harus lebih dari 0';
        ROLLBACK;
        LEAVE sp_process_payment;
    END IF;
    
    IF p_amount > v_remaining THEN
        SET p_result_code = 4;
        SET p_result_message = CONCAT('Jumlah melebihi sisa tagihan: ', v_remaining);
        ROLLBACK;
        LEAVE sp_process_payment;
    END IF;
    
    -- Insert payment
    INSERT INTO payments (
        jamaah_id, payment_method_id, payment_type, reference_number,
        amount, bank_name, status, created_by
    ) VALUES (
        p_jamaah_id, p_payment_method_id, 
        CASE WHEN v_amount_paid = 0 THEN 'down_payment' ELSE 'installment' END,
        p_reference_number, p_amount, p_bank_name, 'pending', p_processed_by
    );
    
    SET p_payment_id = LAST_INSERT_ID();
    SET p_result_code = 0;
    SET p_result_message = 'Pembayaran berhasil dicatat';
    
    COMMIT;
END$$

-- Procedure to create departure group
CREATE PROCEDURE sp_create_departure_group(
    IN p_package_id INT,
    IN p_name VARCHAR(200),
    IN p_max_members INT,
    IN p_departure_time DATETIME,
    IN p_meeting_point VARCHAR(255),
    IN p_created_by INT,
    OUT p_group_id INT,
    OUT p_group_code VARCHAR(50),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_package_exists INT DEFAULT 0;
    DECLARE v_code_exists INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_message = 'Database error occurred during group creation';
    END;
    
    START TRANSACTION;
    
    -- Check if package exists
    SELECT COUNT(*) INTO v_package_exists FROM packages WHERE id = p_package_id;
    IF v_package_exists = 0 THEN
        SET p_result_code = 1;
        SET p_result_message = 'Paket tidak ditemukan';
        ROLLBACK;
        LEAVE sp_create_departure_group;
    END IF;
    
    -- Generate group code
    SET p_group_code = CONCAT(
        'GRP',
        YEAR(p_departure_time),
        LPAD(MONTH(p_departure_time), 2, '0'),
        LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM groups), 4, '0')
    );
    
    -- Check if code already exists (very unlikely but safety first)
    SELECT COUNT(*) INTO v_code_exists FROM groups WHERE code = p_group_code;
    IF v_code_exists > 0 THEN
        SET p_group_code = CONCAT(p_group_code, '_', UNIX_TIMESTAMP());
    END IF;
    
    -- Insert group
    INSERT INTO groups (
        package_id, name, code, max_members, departure_time, 
        meeting_point, status, created_by
    ) VALUES (
        p_package_id, p_name, p_group_code, p_max_members, 
        p_departure_time, p_meeting_point, 'planning', p_created_by
    );
    
    SET p_group_id = LAST_INSERT_ID();
    SET p_result_code = 0;
    SET p_result_message = 'Grup berhasil dibuat';
    
    COMMIT;
END$$

-- Procedure to assign jamaah to group
CREATE PROCEDURE sp_assign_jamaah_to_group(
    IN p_jamaah_id INT,
    IN p_group_id INT,
    IN p_assigned_by INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_jamaah_exists INT DEFAULT 0;
    DECLARE v_group_exists INT DEFAULT 0;
    DECLARE v_group_full INT DEFAULT 0;
    DECLARE v_same_package INT DEFAULT 0;
    DECLARE v_current_group INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_message = 'Database error occurred during group assignment';
    END;
    
    START TRANSACTION;
    
    -- Check if jamaah exists and get current group
    SELECT COUNT(*), group_id INTO v_jamaah_exists, v_current_group 
    FROM jamaah WHERE id = p_jamaah_id;
    
    IF v_jamaah_exists = 0 THEN
        SET p_result_code = 1;
        SET p_result_message = 'Jamaah tidak ditemukan';
        ROLLBACK;
        LEAVE sp_assign_jamaah_to_group;
    END IF;
    
    -- Check if group exists and not full
    SELECT COUNT(*) INTO v_group_exists 
    FROM groups WHERE id = p_group_id;
    
    IF v_group_exists = 0 THEN
        SET p_result_code = 2;
        SET p_result_message = 'Grup tidak ditemukan';
        ROLLBACK;
        LEAVE sp_assign_jamaah_to_group;
    END IF;
    
    -- Check if group is full
    SELECT CASE WHEN current_members >= max_members THEN 1 ELSE 0 END 
    INTO v_group_full FROM groups WHERE id = p_group_id;
    
    IF v_group_full = 1 THEN
        SET p_result_code = 3;
        SET p_result_message = 'Grup sudah penuh';
        ROLLBACK;
        LEAVE sp_assign_jamaah_to_group;
    END IF;
    
    -- Check if jamaah and group are from same package
    SELECT COUNT(*) INTO v_same_package
    FROM jamaah j
    JOIN groups g ON j.package_id = g.package_id
    WHERE j.id = p_jamaah_id AND g.id = p_group_id;
    
    IF v_same_package = 0 THEN
        SET p_result_code = 4;
        SET p_result_message = 'Jamaah dan grup harus dari paket yang sama';
        ROLLBACK;
        LEAVE sp_assign_jamaah_to_group;
    END IF;
    
    -- Update jamaah group
    UPDATE jamaah SET group_id = p_group_id WHERE id = p_jamaah_id;
    
    -- Log group assignment history
    INSERT INTO group_member_history (jamaah_id, group_id, action, previous_group_id, changed_by)
    VALUES (p_jamaah_id, p_group_id, 'added', v_current_group, p_assigned_by);
    
    SET p_result_code = 0;
    SET p_result_message = 'Jamaah berhasil ditambahkan ke grup';
    
    COMMIT;
END$$

-- Procedure to generate comprehensive report
CREATE PROCEDURE sp_generate_jamaah_report(
    IN p_package_id INT,
    IN p_status VARCHAR(50),
    IN p_date_from DATE,
    IN p_date_to DATE
)
BEGIN
    SELECT 
        j.registration_number,
        j.full_name,
        j.nik,
        j.phone,
        j.email,
        p.name as package_name,
        j.registration_status,
        j.payment_status,
        j.document_status,
        j.visa_status,
        j.total_amount,
        j.amount_paid,
        j.amount_due,
        g.name as group_name,
        g.departure_time,
        j.created_at as registration_date,
        CONCAT(u.full_name) as registered_by
    FROM jamaah j
    LEFT JOIN packages p ON j.package_id = p.id
    LEFT JOIN groups g ON j.group_id = g.id
    LEFT JOIN users u ON j.registered_by = u.id
    WHERE 
        (p_package_id IS NULL OR j.package_id = p_package_id)
        AND (p_status IS NULL OR j.registration_status = p_status)
        AND (p_date_from IS NULL OR DATE(j.created_at) >= p_date_from)
        AND (p_date_to IS NULL OR DATE(j.created_at) <= p_date_to)
    ORDER BY j.created_at DESC;
END$$

-- Procedure for automated backup
CREATE PROCEDURE sp_create_backup(
    IN p_backup_type ENUM('full', 'incremental', 'differential'),
    IN p_created_by INT,
    OUT p_backup_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_file_path VARCHAR(500);
    DECLARE v_timestamp VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Database error occurred during backup';
    END;
    
    -- Generate timestamp for backup file
    SET v_timestamp = DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s');
    SET v_file_path = CONCAT('/backups/umroh_backup_', v_timestamp, '.sql');
    
    -- Insert backup log
    INSERT INTO backup_logs (backup_type, file_path, file_size, status, started_at, created_by)
    VALUES (p_backup_type, v_file_path, 0, 'started', NOW(), p_created_by);
    
    SET p_backup_id = LAST_INSERT_ID();
    
    -- Note: Actual backup execution would be handled by external script
    -- This procedure just logs the backup initiation
    
    SET p_result_code = 0;
    SET p_result_message = CONCAT('Backup initiated with ID: ', p_backup_id);
END$$

DELIMITER ;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Comprehensive jamaah view with all related data
CREATE VIEW vw_jamaah_complete AS
SELECT 
    j.id,
    j.registration_number,
    j.full_name,
    j.nik,
    j.phone,
    j.email,
    j.date_of_birth,
    TIMESTAMPDIFF(YEAR, j.date_of_birth, CURDATE()) as age,
    j.gender,
    j.registration_status,
    j.payment_status,
    j.document_status,
    j.visa_status,
    p.name as package_name,
    p.departure_date,
    p.price as package_price,
    j.total_amount,
    j.amount_paid,
    j.amount_due,
    g.name as group_name,
    g.departure_time,
    g.meeting_point,
    prov.name as province_name,
    city.name as city_name,
    j.created_at as registration_date,
    reg_user.full_name as registered_by_name
FROM jamaah j
LEFT JOIN packages p ON j.package_id = p.id
LEFT JOIN groups g ON j.group_id = g.id
LEFT JOIN provinces prov ON j.province_id = prov.id
LEFT JOIN cities city ON j.city_id = city.id
LEFT JOIN users reg_user ON j.registered_by = reg_user.id;

-- Payment summary view
CREATE VIEW vw_payment_summary AS
SELECT 
    j.id as jamaah_id,
    j.registration_number,
    j.full_name,
    j.total_amount,
    COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.amount ELSE 0 END), 0) as total_paid,
    j.total_amount - COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.amount ELSE 0 END), 0) as remaining_amount,
    COUNT(p.id) as payment_count,
    MAX(p.payment_date) as last_payment_date,
    j.payment_status
FROM jamaah j
LEFT JOIN payments p ON j.id = p.jamaah_id
GROUP BY j.id, j.registration_number, j.full_name, j.total_amount, j.payment_status;

-- Package capacity view
CREATE VIEW vw_package_capacity AS
SELECT 
    p.id,
    p.name,
    p.code,
    p.departure_date,
    p.max_capacity,
    p.current_bookings,
    p.max_capacity - p.current_bookings as available_slots,
    ROUND((p.current_bookings / p.max_capacity) * 100, 2) as occupancy_percentage,
    p.status,
    COUNT(j.id) as actual_bookings
FROM packages p
LEFT JOIN jamaah j ON p.id = j.package_id AND j.registration_status IN ('verified', 'approved')
GROUP BY p.id, p.name, p.code, p.departure_date, p.max_capacity, p.current_bookings, p.status;

-- Document completion view
CREATE VIEW vw_document_completion AS
SELECT 
    j.id as jamaah_id,
    j.registration_number,
    j.full_name,
    COUNT(dt.id) as required_documents,
    COUNT(d.id) as submitted_documents,
    COUNT(CASE WHEN d.status = 'approved' THEN 1 END) as approved_documents,
    ROUND((COUNT(d.id) / COUNT(dt.id)) * 100, 2) as submission_percentage,
    ROUND((COUNT(CASE WHEN d.status = 'approved' THEN 1 END) / COUNT(dt.id)) * 100, 2) as approval_percentage,
    CASE 
        WHEN COUNT(CASE WHEN d.status = 'approved' THEN 1 END) = COUNT(dt.id) THEN 'Complete'
        WHEN COUNT(d.id) = COUNT(dt.id) THEN 'Pending Review'
        ELSE 'Incomplete'
    END as completion_status
FROM jamaah j
CROSS JOIN document_types dt
LEFT JOIN documents d ON j.id = d.jamaah_id AND dt.id = d.document_type_id AND d.is_current_version = 1
WHERE dt.is_mandatory = 1
GROUP BY j.id, j.registration_number, j.full_name;

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_jamaah_package_status ON jamaah(package_id, registration_status, payment_status);
CREATE INDEX idx_payments_jamaah_status ON payments(jamaah_id, status, payment_date);
CREATE INDEX idx_documents_jamaah_type ON documents(jamaah_id, document_type_id, is_current_version);
CREATE INDEX idx_audit_logs_table_date ON audit_logs(table_name, created_at);
CREATE INDEX idx_notifications_recipient_date ON notifications(recipient, created_at);

-- Full-text search indexes
ALTER TABLE jamaah ADD FULLTEXT(full_name, phone, email);
ALTER TABLE packages ADD FULLTEXT(name, description);

-- =====================================================
-- EVENTS FOR AUTOMATED MAINTENANCE
-- =====================================================

-- Clean up old sessions daily
CREATE EVENT ev_cleanup_sessions
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM user_sessions WHERE expires_at < NOW();

-- Clean up old audit logs (keep 1 year)
CREATE EVENT ev_cleanup_audit_logs
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Update package status based on departure date
CREATE EVENT ev_update_package_status
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  UPDATE packages 
  SET status = 'completed' 
  WHERE status IN ('published', 'full') 
  AND return_date < CURDATE();

-- Send payment reminders
CREATE EVENT ev_payment_reminders
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_jamaah_id INT;
  DECLARE v_jamaah_name VARCHAR(200);
  DECLARE v_due_amount DECIMAL(15,2);
  DECLARE v_departure_date DATE;
  
  DECLARE cur CURSOR FOR 
    SELECT j.id, j.full_name, j.amount_due, p.departure_date
    FROM jamaah j
    JOIN packages p ON j.package_id = p.id
    WHERE j.payment_status IN ('pending', 'partial')
    AND p.departure_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);
    
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_jamaah_id, v_jamaah_name, v_due_amount, v_departure_date;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Insert notification for payment reminder
    INSERT INTO notifications (jamaah_id, type, recipient, subject, content, priority)
    SELECT v_jamaah_id, 'email', j.email, 'Pengingat Pembayaran',
           CONCAT('Halo ', v_jamaah_name, ', sisa pembayaran Anda sebesar Rp ', FORMAT(v_due_amount, 0), ' mohon segera dilunasi sebelum keberangkatan tanggal ', v_departure_date),
           'normal'
    FROM jamaah j WHERE j.id = v_jamaah_id AND j.email IS NOT NULL;
    
  END LOOP;
  
  CLOSE cur;
END;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

COMMIT;