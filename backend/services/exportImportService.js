const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const { query } = require('../config/database');
const logger = require('../config/logging').logger;

class ExportImportService {
  constructor() {
    this.exportDir = process.env.EXPORT_DIR || path.join(__dirname, '../../exports');
    this.templateDir = path.join(__dirname, '../../templates');
    
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await fs.access(this.exportDir);
    } catch (error) {
      await fs.mkdir(this.exportDir, { recursive: true });
    }
    
    try {
      await fs.access(this.templateDir);
    } catch (error) {
      await fs.mkdir(this.templateDir, { recursive: true });
    }
  }

  // Generate Excel template for jamaah import
  async generateJamaahTemplate() {
    try {
      const templateData = [
        {
          'Nama Lengkap *': 'Ahmad Wijaya',
          'NIK *': '3173010101900001',
          'Tempat Lahir': 'Jakarta',
          'Tanggal Lahir (YYYY-MM-DD)': '1990-01-01',
          'Jenis Kelamin (M/F) *': 'M',
          'Status Pernikahan': 'Menikah',
          'Alamat': 'Jl. Kebon Jeruk No. 123, Jakarta Barat',
          'Telepon': '081234567890',
          'Email': 'ahmad.wijaya@email.com',
          'Kontak Darurat': 'Siti Wijaya',
          'Telepon Darurat': '081234567891',
          'Nomor Paspor': 'B1234567',
          'Tanggal Terbit Paspor (YYYY-MM-DD)': '2020-01-01',
          'Tanggal Kadaluarsa Paspor (YYYY-MM-DD)': '2025-01-01',
          'Tempat Terbit Paspor': 'Jakarta',
          'ID Package *': '1',
          'Catatan Medis': '',
          'Lansia (Ya/Tidak)': 'Tidak',
          'Kebutuhan Khusus': ''
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      // Add instructions sheet
      const instructions = [
        { Field: 'Nama Lengkap', Required: 'Ya', Description: 'Nama lengkap sesuai KTP', Example: 'Ahmad Wijaya' },
        { Field: 'NIK', Required: 'Ya', Description: 'Nomor Induk Kependudukan 16 digit', Example: '3173010101900001' },
        { Field: 'Tempat Lahir', Required: 'Tidak', Description: 'Tempat lahir', Example: 'Jakarta' },
        { Field: 'Tanggal Lahir', Required: 'Tidak', Description: 'Format: YYYY-MM-DD', Example: '1990-01-01' },
        { Field: 'Jenis Kelamin', Required: 'Ya', Description: 'M untuk Laki-laki, F untuk Perempuan', Example: 'M' },
        { Field: 'Status Pernikahan', Required: 'Tidak', Description: 'Status pernikahan', Example: 'Menikah' },
        { Field: 'Alamat', Required: 'Tidak', Description: 'Alamat lengkap', Example: 'Jl. Kebon Jeruk No. 123' },
        { Field: 'Telepon', Required: 'Tidak', Description: 'Nomor telepon/HP', Example: '081234567890' },
        { Field: 'Email', Required: 'Tidak', Description: 'Alamat email', Example: 'email@domain.com' },
        { Field: 'Kontak Darurat', Required: 'Tidak', Description: 'Nama kontak darurat', Example: 'Siti Wijaya' },
        { Field: 'Telepon Darurat', Required: 'Tidak', Description: 'Nomor telepon kontak darurat', Example: '081234567891' },
        { Field: 'Nomor Paspor', Required: 'Tidak', Description: 'Nomor paspor', Example: 'B1234567' },
        { Field: 'Tanggal Terbit Paspor', Required: 'Tidak', Description: 'Format: YYYY-MM-DD', Example: '2020-01-01' },
        { Field: 'Tanggal Kadaluarsa Paspor', Required: 'Tidak', Description: 'Format: YYYY-MM-DD', Example: '2025-01-01' },
        { Field: 'Tempat Terbit Paspor', Required: 'Tidak', Description: 'Tempat terbit paspor', Example: 'Jakarta' },
        { Field: 'ID Package', Required: 'Ya', Description: 'ID package dari sistem', Example: '1' },
        { Field: 'Catatan Medis', Required: 'Tidak', Description: 'Catatan khusus medis', Example: 'Diabetes' },
        { Field: 'Lansia', Required: 'Tidak', Description: 'Ya atau Tidak', Example: 'Tidak' },
        { Field: 'Kebutuhan Khusus', Required: 'Tidak', Description: 'Kebutuhan khusus lainnya', Example: 'Kursi roda' }
      ];

      const wsInstructions = XLSX.utils.json_to_sheet(instructions);

      XLSX.utils.book_append_sheet(wb, ws, 'Template Data');
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Panduan');

      const filename = `jamaah_import_template_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filepath = path.join(this.templateDir, filename);

      XLSX.writeFile(wb, filepath);

      logger.info(`Jamaah import template generated: ${filename}`);
      return { filename, filepath };
    } catch (error) {
      logger.error('Failed to generate jamaah template:', error);
      throw error;
    }
  }

  // Generate Excel template for payments import
  async generatePaymentTemplate() {
    try {
      const templateData = [
        {
          'NIK Jamaah *': '3173010101900001',
          'Jumlah Pembayaran *': '15000000',
          'Metode Pembayaran *': 'Transfer Bank',
          'Bank': 'BCA',
          'Nomor Rekening': '1234567890',
          'Nama Rekening': 'Ahmad Wijaya',
          'Tanggal Pembayaran (YYYY-MM-DD)': '2024-01-15',
          'Nomor Referensi': 'TRF001234567',
          'Catatan': 'Pembayaran DP',
          'Bukti Transfer (URL/Path)': ''
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      const instructions = [
        { Field: 'NIK Jamaah', Required: 'Ya', Description: 'NIK jamaah yang sudah terdaftar', Example: '3173010101900001' },
        { Field: 'Jumlah Pembayaran', Required: 'Ya', Description: 'Jumlah dalam rupiah (tanpa titik/koma)', Example: '15000000' },
        { Field: 'Metode Pembayaran', Required: 'Ya', Description: 'Metode pembayaran', Example: 'Transfer Bank' },
        { Field: 'Bank', Required: 'Tidak', Description: 'Nama bank', Example: 'BCA' },
        { Field: 'Nomor Rekening', Required: 'Tidak', Description: 'Nomor rekening pengirim', Example: '1234567890' },
        { Field: 'Nama Rekening', Required: 'Tidak', Description: 'Nama pemilik rekening', Example: 'Ahmad Wijaya' },
        { Field: 'Tanggal Pembayaran', Required: 'Tidak', Description: 'Format: YYYY-MM-DD', Example: '2024-01-15' },
        { Field: 'Nomor Referensi', Required: 'Tidak', Description: 'Nomor referensi transaksi', Example: 'TRF001234567' },
        { Field: 'Catatan', Required: 'Tidak', Description: 'Catatan tambahan', Example: 'Pembayaran DP' },
        { Field: 'Bukti Transfer', Required: 'Tidak', Description: 'URL atau path file bukti', Example: 'https://...' }
      ];

      const wsInstructions = XLSX.utils.json_to_sheet(instructions);

      XLSX.utils.book_append_sheet(wb, ws, 'Template Data');
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Panduan');

      const filename = `payment_import_template_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filepath = path.join(this.templateDir, filename);

      XLSX.writeFile(wb, filepath);

      logger.info(`Payment import template generated: ${filename}`);
      return { filename, filepath };
    } catch (error) {
      logger.error('Failed to generate payment template:', error);
      throw error;
    }
  }

  // Export all jamaah data
  async exportAllJamaah(filters = {}) {
    try {
      let whereConditions = ['j.is_deleted = false'];
      let values = [];
      let paramCount = 0;

      if (filters.package_id) {
        paramCount++;
        whereConditions.push(`j.package_id = $${paramCount}`);
        values.push(filters.package_id);
      }

      if (filters.jamaah_status) {
        paramCount++;
        whereConditions.push(`j.jamaah_status = $${paramCount}`);
        values.push(filters.jamaah_status);
      }

      if (filters.visa_status) {
        paramCount++;
        whereConditions.push(`j.visa_status = $${paramCount}`);
        values.push(filters.visa_status);
      }

      if (filters.payment_status) {
        paramCount++;
        whereConditions.push(`j.payment_status = $${paramCount}`);
        values.push(filters.payment_status);
      }

      if (filters.created_from) {
        paramCount++;
        whereConditions.push(`j.created_at >= $${paramCount}`);
        values.push(filters.created_from);
      }

      if (filters.created_to) {
        paramCount++;
        whereConditions.push(`j.created_at <= $${paramCount}`);
        values.push(filters.created_to);
      }

      const whereClause = whereConditions.join(' AND ');

      const result = await query(`
        SELECT 
          j.id,
          j.full_name as "Nama Lengkap",
          j.nik as "NIK",
          j.birth_place as "Tempat Lahir",
          j.birth_date as "Tanggal Lahir",
          CASE WHEN j.gender = 'M' THEN 'Laki-laki' ELSE 'Perempuan' END as "Jenis Kelamin",
          j.marital_status as "Status Pernikahan",
          j.address as "Alamat",
          j.phone as "Telepon",
          j.email as "Email",
          j.emergency_contact as "Kontak Darurat",
          j.emergency_phone as "Telepon Darurat",
          j.passport_number as "Nomor Paspor",
          j.passport_issue_date as "Tanggal Terbit Paspor",
          j.passport_expiry_date as "Tanggal Kadaluarsa Paspor",
          j.passport_issue_place as "Tempat Terbit Paspor",
          p.name as "Package",
          j.registration_date as "Tanggal Registrasi",
          j.jamaah_status as "Status Jamaah",
          j.visa_status as "Status Visa",
          j.visa_number as "Nomor Visa",
          j.visa_issue_date as "Tanggal Terbit Visa",
          j.visa_expiry_date as "Tanggal Kadaluarsa Visa",
          j.medical_notes as "Catatan Medis",
          CASE WHEN j.is_elderly THEN 'Ya' ELSE 'Tidak' END as "Lansia",
          j.special_needs as "Kebutuhan Khusus",
          j.total_payment as "Total Pembayaran",
          j.remaining_payment as "Sisa Pembayaran",
          j.payment_status as "Status Pembayaran",
          j.group_number as "Nomor Grup",
          j.bus_number as "Nomor Bus",
          j.room_number as "Nomor Kamar",
          j.seat_number as "Nomor Kursi",
          j.created_at as "Tanggal Input"
        FROM jamaah j
        LEFT JOIN packages p ON j.package_id = p.id
        WHERE ${whereClause}
        ORDER BY j.full_name
      `, values);

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(result.rows);

      // Auto-size columns
      const maxWidth = {};
      result.rows.forEach(row => {
        Object.keys(row).forEach(key => {
          const value = row[key]?.toString() || '';
          maxWidth[key] = Math.max(maxWidth[key] || 0, Math.min(value.length, 50));
        });
      });

      ws['!cols'] = Object.keys(maxWidth).map(key => ({ width: maxWidth[key] + 2 }));

      XLSX.utils.book_append_sheet(wb, ws, 'Data Jamaah');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `export_jamaah_${timestamp}.xlsx`;
      const filepath = path.join(this.exportDir, filename);

      XLSX.writeFile(wb, filepath);

      logger.info(`Jamaah data exported: ${filename}, ${result.rows.length} records`);
      return { filename, filepath, recordCount: result.rows.length };
    } catch (error) {
      logger.error('Failed to export jamaah data:', error);
      throw error;
    }
  }

  // Export payments data
  async exportPayments(filters = {}) {
    try {
      let whereConditions = ['1=1'];
      let values = [];
      let paramCount = 0;

      if (filters.jamaah_id) {
        paramCount++;
        whereConditions.push(`p.jamaah_id = $${paramCount}`);
        values.push(filters.jamaah_id);
      }

      if (filters.payment_method) {
        paramCount++;
        whereConditions.push(`p.payment_method = $${paramCount}`);
        values.push(filters.payment_method);
      }

      if (filters.verified) {
        paramCount++;
        if (filters.verified === 'true') {
          whereConditions.push(`p.verified_by IS NOT NULL`);
        } else {
          whereConditions.push(`p.verified_by IS NULL`);
        }
      }

      if (filters.date_from) {
        paramCount++;
        whereConditions.push(`p.payment_date >= $${paramCount}`);
        values.push(filters.date_from);
      }

      if (filters.date_to) {
        paramCount++;
        whereConditions.push(`p.payment_date <= $${paramCount}`);
        values.push(filters.date_to);
      }

      const whereClause = whereConditions.join(' AND ');

      const result = await query(`
        SELECT 
          p.id,
          j.full_name as "Nama Jamaah",
          j.nik as "NIK",
          pkg.name as "Package",
          p.amount as "Jumlah",
          p.payment_method as "Metode Pembayaran",
          p.bank_name as "Bank",
          p.account_number as "Nomor Rekening",
          p.account_name as "Nama Rekening",
          p.payment_date as "Tanggal Pembayaran",
          p.reference_number as "Nomor Referensi",
          p.notes as "Catatan",
          p.receipt_url as "Bukti Transfer",
          CASE WHEN p.verified_by IS NOT NULL THEN 'Verified' ELSE 'Pending' END as "Status Verifikasi",
          vuser.full_name as "Diverifikasi Oleh",
          p.verification_date as "Tanggal Verifikasi",
          p.created_at as "Tanggal Input"
        FROM payments p
        JOIN jamaah j ON p.jamaah_id = j.id
        LEFT JOIN packages pkg ON j.package_id = pkg.id
        LEFT JOIN users vuser ON p.verified_by = vuser.id
        WHERE ${whereClause}
        ORDER BY p.payment_date DESC, p.created_at DESC
      `, values);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(result.rows);

      XLSX.utils.book_append_sheet(wb, ws, 'Data Pembayaran');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `export_payments_${timestamp}.xlsx`;
      const filepath = path.join(this.exportDir, filename);

      XLSX.writeFile(wb, filepath);

      logger.info(`Payment data exported: ${filename}, ${result.rows.length} records`);
      return { filename, filepath, recordCount: result.rows.length };
    } catch (error) {
      logger.error('Failed to export payment data:', error);
      throw error;
    }
  }

  // Export packages data
  async exportPackages() {
    try {
      const result = await query(`
        SELECT 
          p.id,
          p.name as "Nama Package",
          p.description as "Deskripsi",
          p.price as "Harga",
          p.departure_date as "Tanggal Berangkat",
          p.return_date as "Tanggal Pulang",
          p.hotel_mecca as "Hotel Mecca",
          p.hotel_medina as "Hotel Medina",
          p.airline as "Maskapai",
          p.max_capacity as "Kapasitas Maksimal",
          p.current_capacity as "Kapasitas Saat Ini",
          CASE WHEN p.is_active THEN 'Aktif' ELSE 'Tidak Aktif' END as "Status",
          p.created_at as "Tanggal Dibuat",
          p.updated_at as "Tanggal Update"
        FROM packages p
        ORDER BY p.departure_date ASC
      `);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(result.rows);

      XLSX.utils.book_append_sheet(wb, ws, 'Data Package');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `export_packages_${timestamp}.xlsx`;
      const filepath = path.join(this.exportDir, filename);

      XLSX.writeFile(wb, filepath);

      logger.info(`Package data exported: ${filename}, ${result.rows.length} records`);
      return { filename, filepath, recordCount: result.rows.length };
    } catch (error) {
      logger.error('Failed to export package data:', error);
      throw error;
    }
  }

  // Export groups data
  async exportGroups(filters = {}) {
    try {
      let whereConditions = ['1=1'];
      let values = [];
      let paramCount = 0;

      if (filters.package_id) {
        paramCount++;
        whereConditions.push(`g.package_id = $${paramCount}`);
        values.push(filters.package_id);
      }

      const whereClause = whereConditions.join(' AND ');

      const result = await query(`
        SELECT 
          g.id,
          g.name as "Nama Grup",
          p.name as "Package",
          j.full_name as "Ketua Grup",
          g.departure_date as "Tanggal Berangkat",
          g.bus_number as "Nomor Bus",
          g.gathering_point as "Titik Kumpul",
          g.gathering_time as "Waktu Kumpul",
          g.hotel_info as "Info Hotel",
          COUNT(gm.jamaah_id) as "Jumlah Anggota",
          g.notes as "Catatan",
          g.created_at as "Tanggal Dibuat"
        FROM groups g
        LEFT JOIN packages p ON g.package_id = p.id
        LEFT JOIN jamaah j ON g.leader_jamaah_id = j.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE ${whereClause}
        GROUP BY g.id, p.name, j.full_name
        ORDER BY g.departure_date ASC, g.name ASC
      `, values);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(result.rows);

      XLSX.utils.book_append_sheet(wb, ws, 'Data Grup');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `export_groups_${timestamp}.xlsx`;
      const filepath = path.join(this.exportDir, filename);

      XLSX.writeFile(wb, filepath);

      logger.info(`Groups data exported: ${filename}, ${result.rows.length} records`);
      return { filename, filepath, recordCount: result.rows.length };
    } catch (error) {
      logger.error('Failed to export groups data:', error);
      throw error;
    }
  }

  // Import jamaah data from Excel
  async importJamaahFromExcel(filepath, userId) {
    try {
      const workbook = XLSX.readFile(filepath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        total: data.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel row number (1-indexed + header)

        try {
          // Validate required fields
          if (!row['Nama Lengkap *'] || !row['NIK *'] || !row['Jenis Kelamin (M/F) *'] || !row['ID Package *']) {
            throw new Error('Missing required fields');
          }

          // Check NIK uniqueness
          const nikCheck = await query('SELECT id FROM jamaah WHERE nik = $1 AND is_deleted = false', [row['NIK *']]);
          if (nikCheck.rows.length > 0) {
            throw new Error('NIK already exists');
          }

          // Validate package exists
          const packageCheck = await query('SELECT id FROM packages WHERE id = $1', [row['ID Package *']]);
          if (packageCheck.rows.length === 0) {
            throw new Error('Package not found');
          }

          // Insert jamaah
          const jamaahData = {
            full_name: row['Nama Lengkap *'],
            nik: row['NIK *'],
            birth_place: row['Tempat Lahir'] || null,
            birth_date: row['Tanggal Lahir (YYYY-MM-DD)'] || null,
            gender: row['Jenis Kelamin (M/F) *'],
            marital_status: row['Status Pernikahan'] || null,
            address: row['Alamat'] || null,
            phone: row['Telepon'] || null,
            email: row['Email'] || null,
            emergency_contact: row['Kontak Darurat'] || null,
            emergency_phone: row['Telepon Darurat'] || null,
            passport_number: row['Nomor Paspor'] || null,
            passport_issue_date: row['Tanggal Terbit Paspor (YYYY-MM-DD)'] || null,
            passport_expiry_date: row['Tanggal Kadaluarsa Paspor (YYYY-MM-DD)'] || null,
            passport_issue_place: row['Tempat Terbit Paspor'] || null,
            package_id: row['ID Package *'],
            medical_notes: row['Catatan Medis'] || null,
            is_elderly: row['Lansia (Ya/Tidak)'] === 'Ya',
            special_needs: row['Kebutuhan Khusus'] || null,
            created_by: userId
          };

          await query(`
            INSERT INTO jamaah (
              full_name, nik, birth_place, birth_date, gender, marital_status,
              address, phone, email, emergency_contact, emergency_phone,
              passport_number, passport_issue_date, passport_expiry_date, passport_issue_place,
              package_id, medical_notes, is_elderly, special_needs, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
          `, Object.values(jamaahData));

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            data: row['Nama Lengkap *'] || `Row ${rowNumber}`,
            error: error.message
          });
        }
      }

      logger.info(`Jamaah import completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      logger.error('Failed to import jamaah data:', error);
      throw error;
    }
  }

  // Get export/import statistics
  async getStatistics() {
    try {
      const exportFiles = await fs.readdir(this.exportDir);
      const templateFiles = await fs.readdir(this.templateDir);

      let exportSize = 0;
      for (const file of exportFiles) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);
        exportSize += stats.size;
      }

      return {
        exportFiles: exportFiles.length,
        templateFiles: templateFiles.length,
        exportSizeMB: exportSize / (1024 * 1024),
        lastExports: exportFiles.slice(-5)
      };
    } catch (error) {
      logger.error('Failed to get export/import statistics:', error);
      throw error;
    }
  }

  // Clean old export files
  async cleanupOldExports(daysOld = 30) {
    try {
      const files = await fs.readdir(this.exportDir);
      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.info(`Deleted old export file: ${file}`);
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old exports:', error);
      throw error;
    }
  }
}

module.exports = new ExportImportService();