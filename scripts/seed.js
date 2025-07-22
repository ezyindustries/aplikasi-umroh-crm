const { sequelize, models } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create default admin user
    const adminExists = await models.User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await models.User.create({
        username: 'admin',
        password: hashedPassword,
        full_name: 'Administrator',
        email: 'admin@vauza-tamma.com',
        role: 'admin',
        is_active: true
      });
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }

    // Create Chart of Accounts (COA)
    const coaExists = await models.ChartOfAccount.findOne();
    if (!coaExists) {
      const adminUser = await models.User.findOne({ where: { username: 'admin' } });
      
      const coaData = [
        // Assets
        { code: '1000', name: 'ASET', type: 'asset', subtype: 'current', normal_balance: 'debit', level: 1 },
        { code: '1100', name: 'Kas dan Bank', type: 'asset', subtype: 'current', normal_balance: 'debit', level: 2 },
        { code: '1101', name: 'Kas', type: 'asset', subtype: 'current', normal_balance: 'debit', level: 3 },
        { code: '1102', name: 'Bank', type: 'asset', subtype: 'current', normal_balance: 'debit', level: 3 },
        { code: '1200', name: 'Piutang', type: 'asset', subtype: 'current', normal_balance: 'debit', level: 2 },
        { code: '1201', name: 'Piutang Jamaah', type: 'asset', subtype: 'current', normal_balance: 'debit', level: 3 },
        
        // Liabilities
        { code: '2000', name: 'KEWAJIBAN', type: 'liability', subtype: 'current', normal_balance: 'credit', level: 1 },
        { code: '2100', name: 'Utang Lancar', type: 'liability', subtype: 'current', normal_balance: 'credit', level: 2 },
        { code: '2101', name: 'Utang Usaha', type: 'liability', subtype: 'current', normal_balance: 'credit', level: 3 },
        
        // Equity
        { code: '3000', name: 'MODAL', type: 'equity', subtype: 'equity', normal_balance: 'credit', level: 1 },
        { code: '3100', name: 'Modal Pemilik', type: 'equity', subtype: 'equity', normal_balance: 'credit', level: 2 },
        
        // Revenue
        { code: '4000', name: 'PENDAPATAN', type: 'revenue', subtype: 'operating', normal_balance: 'credit', level: 1 },
        { code: '4100', name: 'Pendapatan Umroh', type: 'revenue', subtype: 'operating', normal_balance: 'credit', level: 2 },
        { code: '4101', name: 'Pendapatan Paket Umroh', type: 'revenue', subtype: 'operating', normal_balance: 'credit', level: 3 },
        
        // Expenses
        { code: '5000', name: 'BEBAN', type: 'expense', subtype: 'operating', normal_balance: 'debit', level: 1 },
        { code: '5100', name: 'Beban Operasional', type: 'expense', subtype: 'operating', normal_balance: 'debit', level: 2 },
        { code: '5101', name: 'Beban Hotel', type: 'expense', subtype: 'operating', normal_balance: 'debit', level: 3 },
        { code: '5102', name: 'Beban Transportasi', type: 'expense', subtype: 'operating', normal_balance: 'debit', level: 3 },
        { code: '5103', name: 'Beban Visa', type: 'expense', subtype: 'operating', normal_balance: 'debit', level: 3 }
      ];

      for (const coa of coaData) {
        await models.ChartOfAccount.create({
          account_code: coa.code,
          account_name: coa.name,
          account_type: coa.type,
          account_subtype: coa.subtype,
          normal_balance: coa.normal_balance,
          level: coa.level,
          is_system: true,
          is_active: true,
          created_by: adminUser.id
        });
      }
      console.log('✅ Chart of Accounts created');
    }

    // Create sample package
    const packageExists = await models.Package.findOne();
    if (!packageExists) {
      const adminUser = await models.User.findOne({ where: { username: 'admin' } });
      
      await models.Package.create({
        package_code: 'UMR2024001',
        package_name: 'Umroh Reguler 12 Hari',
        description: 'Paket umroh reguler 12 hari dengan fasilitas lengkap',
        duration_days: 12,
        price: 25000000,
        quota: 45,
        current_quota: 0,
        hotel_mecca: 'Hotel Dar Al Eiman Al Masjid Al Haram',
        hotel_medina: 'Hotel Al Eman Royal',
        flight_details: JSON.stringify({
          airline: 'Saudi Arabian Airlines',
          departure: 'CGK - JED',
          return: 'MED - CGK',
          transit: 'Direct'
        }),
        facilities: JSON.stringify([
          'visa_umroh',
          'hotel_5_star',
          'transportation',
          'tour_guide',
          'breakfast',
          'zam_zam_water'
        ]),
        status: 'active',
        created_by: adminUser.id
      });
      console.log('✅ Sample package created');
    }

    // Create default message templates
    const templateExists = await models.MessageTemplate.findOne();
    if (!templateExists) {
      const adminUser = await models.User.findOne({ where: { username: 'admin' } });
      
      const templates = [
        {
          template_name: 'Welcome New Lead',
          category: 'welcome',
          message_content: 'Assalamu\'alaikum {name}, terima kasih telah menghubungi Vauza Tamma. Kami siap membantu perjalanan umroh Anda. Ada yang bisa kami bantu?',
          variables: JSON.stringify(['name'])
        },
        {
          template_name: 'Payment Reminder',
          category: 'payment_reminder',
          message_content: 'Halo {name}, ini pengingat bahwa pembayaran umroh Anda sebesar Rp {amount} akan jatuh tempo pada {due_date}. Silakan segera melakukan pembayaran.',
          variables: JSON.stringify(['name', 'amount', 'due_date'])
        },
        {
          template_name: 'Follow Up Interested',
          category: 'follow_up',
          message_content: 'Halo {name}, bagaimana kabarnya? Apakah masih berminat dengan paket umroh {package_name}? Kami ada promo spesial bulan ini!',
          variables: JSON.stringify(['name', 'package_name'])
        }
      ];

      for (const template of templates) {
        await models.MessageTemplate.create({
          ...template,
          is_active: true,
          created_by: adminUser.id
        });
      }
      console.log('✅ Default message templates created');
    }

    console.log('🌱 Database seeding completed successfully!');
    console.log('📋 Default login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedDatabase;