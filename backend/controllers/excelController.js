const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const Jamaah = require('../models/Jamaah');
const { query } = require('../config/database');

class ExcelController {

  // Import jamaah data from Excel file
  static async importJamaah(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File Excel wajib diupload'
        });
      }

      const filePath = req.file.path;
      
      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'File Excel kosong atau format tidak valid'
        });
      }

      // Validate and process data
      const results = {
        total_rows: jsonData.length,
        successful_rows: 0,
        failed_rows: 0,
        errors: [],
        success_data: []
      };

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i];
          const rowNumber = i + 2; // Excel row number (starting from 2)

          // Map Excel columns to database fields
          const jamaahData = {
            full_name: row['Nama Lengkap'] || row['nama_lengkap'] || '',
            nik: row['NIK'] || row['nik'] || '',
            birth_place: row['Tempat Lahir'] || row['tempat_lahir'] || '',
            birth_date: this.parseDate(row['Tanggal Lahir'] || row['tanggal_lahir']),
            gender: this.parseGender(row['Jenis Kelamin'] || row['jenis_kelamin']),
            marital_status: row['Status Nikah'] || row['status_nikah'] || '',
            address: row['Alamat'] || row['alamat'] || '',
            phone: row['Telepon'] || row['telepon'] || '',
            email: row['Email'] || row['email'] || '',
            emergency_contact: row['Kontak Darurat'] || row['kontak_darurat'] || '',
            emergency_phone: row['Telepon Darurat'] || row['telepon_darurat'] || '',
            passport_number: row['No Paspor'] || row['no_paspor'] || '',
            passport_issue_date: this.parseDate(row['Tanggal Terbit Paspor'] || row['tanggal_terbit_paspor']),
            passport_expiry_date: this.parseDate(row['Tanggal Kadaluarsa Paspor'] || row['tanggal_kadaluarsa_paspor']),
            passport_issue_place: row['Tempat Terbit Paspor'] || row['tempat_terbit_paspor'] || '',
            medical_notes: row['Catatan Medis'] || row['catatan_medis'] || '',
            is_elderly: this.parseBoolean(row['Lansia'] || row['lansia']),
            special_needs: row['Kebutuhan Khusus'] || row['kebutuhan_khusus'] || ''
          };

          // Validate required fields
          if (!jamaahData.full_name || !jamaahData.nik) {
            throw new Error('Nama lengkap dan NIK wajib diisi');
          }

          // Create jamaah
          const jamaah = await Jamaah.create(jamaahData, req.user.id);
          results.successful_rows++;
          results.success_data.push({
            row: rowNumber,
            name: jamaah.full_name,
            nik: jamaah.nik
          });

        } catch (error) {
          results.failed_rows++;
          results.errors.push({
            row: i + 2,
            data: jsonData[i],
            error: error.message
          });
        }
      }

      // Save import history
      await this.saveImportHistory({
        file_name: req.file.originalname,
        total_rows: results.total_rows,
        successful_rows: results.successful_rows,
        failed_rows: results.failed_rows,
        error_details: results.errors,
        imported_by: req.user.id
      });

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: `Import selesai. ${results.successful_rows} data berhasil, ${results.failed_rows} data gagal.`,
        data: results
      });

    } catch (error) {
      // Clean up file if error occurs
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }

  // Export jamaah data to Excel
  static async exportJamaah(req, res, next) {
    try {
      const filters = {};
      if (req.query.package_id) filters.package_id = parseInt(req.query.package_id);
      if (req.query.jamaah_status) filters.jamaah_status = req.query.jamaah_status;
      if (req.query.visa_status) filters.visa_status = req.query.visa_status;
      if (req.query.payment_status) filters.payment_status = req.query.payment_status;

      // Get all jamaah data (without pagination for export)
      const result = await Jamaah.findAll(filters, 1, 10000);
      const jamaahData = result.data;

      // Prepare data for Excel
      const excelData = jamaahData.map(jamaah => ({
        'Nama Lengkap': jamaah.full_name,
        'NIK': jamaah.nik,
        'Tempat Lahir': jamaah.birth_place,
        'Tanggal Lahir': jamaah.birth_date ? this.formatDate(jamaah.birth_date) : '',
        'Jenis Kelamin': jamaah.gender === 'M' ? 'Laki-laki' : 'Perempuan',
        'Status Nikah': jamaah.marital_status,
        'Alamat': jamaah.address,
        'Telepon': jamaah.phone,
        'Email': jamaah.email,
        'Kontak Darurat': jamaah.emergency_contact,
        'Telepon Darurat': jamaah.emergency_phone,
        'No Paspor': jamaah.passport_number,
        'Tanggal Terbit Paspor': jamaah.passport_issue_date ? this.formatDate(jamaah.passport_issue_date) : '',
        'Tanggal Kadaluarsa Paspor': jamaah.passport_expiry_date ? this.formatDate(jamaah.passport_expiry_date) : '',
        'Tempat Terbit Paspor': jamaah.passport_issue_place,
        'Paket': jamaah.package_name,
        'Status Jamaah': jamaah.jamaah_status,
        'Status Visa': jamaah.visa_status,
        'Status Pembayaran': jamaah.payment_status,
        'Total Pembayaran': jamaah.total_payment,
        'Sisa Pembayaran': jamaah.remaining_payment,
        'Catatan Medis': jamaah.medical_notes,
        'Lansia': jamaah.is_elderly ? 'Ya' : 'Tidak',
        'Kebutuhan Khusus': jamaah.special_needs,
        'Tanggal Daftar': this.formatDate(jamaah.registration_date),
        'Dibuat Oleh': jamaah.created_by_name
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [];
      const headers = Object.keys(excelData[0] || {});
      headers.forEach((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...excelData.map(row => String(row[header] || '').length)
        );
        colWidths.push({ wch: Math.min(maxLength + 2, 50) });
      });
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data Jamaah');

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `jamaah_export_${timestamp}.xlsx`;

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Write and send file
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);

    } catch (error) {
      next(error);
    }
  }

  // Generate Excel template for import
  static async downloadTemplate(req, res, next) {
    try {
      const templateData = [{
        'Nama Lengkap': 'John Doe',
        'NIK': '1234567890123456',
        'Tempat Lahir': 'Jakarta',
        'Tanggal Lahir': '1990-01-15',
        'Jenis Kelamin': 'Laki-laki',
        'Status Nikah': 'married',
        'Alamat': 'Jl. Contoh No. 123, Jakarta',
        'Telepon': '081234567890',
        'Email': 'john@example.com',
        'Kontak Darurat': 'Jane Doe',
        'Telepon Darurat': '081234567891',
        'No Paspor': 'A1234567',
        'Tanggal Terbit Paspor': '2023-01-01',
        'Tanggal Kadaluarsa Paspor': '2033-01-01',
        'Tempat Terbit Paspor': 'Jakarta',
        'Catatan Medis': 'Sehat',
        'Lansia': 'Tidak',
        'Kebutuhan Khusus': ''
      }];

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      // Add instructions sheet
      const instructions = [
        ['PETUNJUK PENGGUNAAN TEMPLATE IMPORT JAMAAH'],
        [''],
        ['1. Isi data jamaah sesuai dengan kolom yang tersedia'],
        ['2. Format tanggal: YYYY-MM-DD (contoh: 2023-01-15)'],
        ['3. Jenis Kelamin: Laki-laki atau Perempuan'],
        ['4. Status Nikah: single, married, divorced, widowed'],
        ['5. Lansia: Ya atau Tidak'],
        ['6. NIK harus 16 digit'],
        ['7. Hapus baris contoh sebelum mengupload'],
        [''],
        ['KOLOM WAJIB:'],
        ['- Nama Lengkap'],
        ['- NIK'],
        [''],
        ['KOLOM OPSIONAL:'],
        ['- Semua kolom lainnya dapat dikosongkan jika tidak tersedia']
      ];

      const instructionWs = XLSX.utils.aoa_to_sheet(instructions);
      XLSX.utils.book_append_sheet(wb, instructionWs, 'Petunjuk');
      XLSX.utils.book_append_sheet(wb, ws, 'Template');

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="template_import_jamaah.xlsx"');

      // Write and send file
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);

    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  static parseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  }

  static parseGender(genderString) {
    if (!genderString) return null;
    const gender = genderString.toLowerCase();
    if (gender.includes('laki') || gender === 'm' || gender === 'male') return 'M';
    if (gender.includes('perempuan') || gender === 'f' || gender === 'female') return 'F';
    return null;
  }

  static parseBoolean(boolString) {
    if (!boolString) return false;
    const bool = boolString.toString().toLowerCase();
    return bool === 'ya' || bool === 'yes' || bool === 'true' || bool === '1';
  }

  static formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  }

  static async saveImportHistory(data) {
    await query(
      `INSERT INTO import_history 
       (file_name, total_rows, successful_rows, failed_rows, error_details, imported_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.file_name,
        data.total_rows,
        data.successful_rows,
        data.failed_rows,
        JSON.stringify(data.error_details),
        data.imported_by
      ]
    );
  }
}

module.exports = ExcelController;