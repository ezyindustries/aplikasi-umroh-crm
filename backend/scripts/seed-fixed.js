const { sequelize, models } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create default admin user
    const adminExists = await models.User.findOne({ where: { username: 'admin' } });
    let adminUser;
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser = await models.User.create({
        username: 'admin',
        password: hashedPassword,
        full_name: 'Administrator',
        email: 'admin@vauza-tamma.com',
        role: 'admin',
        is_active: true
      });
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    } else {
      adminUser = adminExists;
    }

    // Create Chart of Accounts (COA)
    const coaExists = await models.ChartOfAccount.findOne();
    if (!coaExists) {
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

    // Create sample packages
    const packageExists = await models.Package.findOne();
    if (!packageExists) {
      const packages = [
        {
          code: 'UMR2025001',
          name: 'Umroh Reguler 12 Hari',
          price: 25000000,
          departure_date: new Date('2025-03-15'),
          return_date: new Date('2025-03-27'),
          duration: 12,
          quota: 45,
          booked: 0,
          makkah_hotel: 'Hotel Dar Al Eiman Al Masjid Al Haram',
          madinah_hotel: 'Hotel Al Eman Royal',
          makkah_nights: 6,
          madinah_nights: 4,
          airline: 'Saudi Arabian Airlines',
          airline_code: 'SV',
          flight_details: {
            outbound: {
              flight_no: 'SV815',
              departure: 'CGK - JED',
              departure_time: '21:00',
              arrival_time: '02:30+1'
            },
            return: {
              flight_no: 'SV816',
              departure: 'MED - CGK',
              departure_time: '09:00',
              arrival_time: '23:30'
            }
          },
          facilities: [
            'Visa Umroh',
            'Hotel Bintang 5',
            'Transportasi Bus AC',
            'Muthawwif Berpengalaman',
            'Handling Bandara',
            'Perlengkapan Umroh',
            'Air Zam-zam 5 Liter',
            'Asuransi Perjalanan'
          ],
          description: 'Paket umroh reguler 12 hari dengan fasilitas lengkap dan pelayanan terbaik',
          status: 'published',
          is_active: true,
          created_by: adminUser.id
        },
        {
          code: 'UMR2025002',
          name: 'Umroh Plus Turki 15 Hari',
          price: 35000000,
          departure_date: new Date('2025-04-10'),
          return_date: new Date('2025-04-25'),
          duration: 15,
          quota: 30,
          booked: 0,
          makkah_hotel: 'Pullman Zamzam Makkah',
          madinah_hotel: 'Intercontinental Dar Al Iman',
          makkah_nights: 5,
          madinah_nights: 4,
          airline: 'Turkish Airlines',
          airline_code: 'TK',
          flight_details: {
            outbound: {
              flight_no: 'TK57',
              departure: 'CGK - IST - JED',
              departure_time: '21:45',
              arrival_time: '09:15+1'
            },
            return: {
              flight_no: 'TK2812',
              departure: 'MED - IST - CGK',
              departure_time: '11:40',
              arrival_time: '09:30+1'
            },
            istanbul: {
              duration: '3 days',
              hotel: 'Radisson Blu Istanbul'
            }
          },
          facilities: [
            'Visa Umroh + Turki',
            'Hotel Bintang 5',
            'Tour Istanbul 3 Hari',
            'Transportasi Bus AC',
            'Muthawwif Berpengalaman',
            'Tour Guide Turki',
            'Handling Bandara',
            'Perlengkapan Umroh',
            'Air Zam-zam 5 Liter',
            'Asuransi Perjalanan'
          ],
          description: 'Paket umroh plus wisata religi ke Turki dengan mengunjungi Istanbul',
          status: 'published',
          is_active: true,
          created_by: adminUser.id
        }
      ];

      for (const pkg of packages) {
        await models.Package.create(pkg);
      }
      console.log('✅ Sample packages created');
    }

    // Create sample roles
    const roles = ['marketing', 'finance', 'operator', 'visa', 'hotel'];
    for (const role of roles) {
      const userExists = await models.User.findOne({ where: { username: role } });
      if (!userExists) {
        const hashedPassword = await bcrypt.hash(`${role}123`, 12);
        await models.User.create({
          username: role,
          password: hashedPassword,
          full_name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
          email: `${role}@vauza-tamma.com`,
          role: role,
          is_active: true,
          created_by: adminUser.id
        });
      }
    }
    console.log('✅ Sample users created for each role');

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the seeding
seedDatabase();