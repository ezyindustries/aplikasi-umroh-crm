# Aplikasi Manajemen Umroh

Sistem manajemen jamaah umroh dalam skala besar (target: 50.000 jamaah/tahun) untuk mengelola data jamaah, paket umroh, pembayaran, dan operasional keberangkatan secara efisien dan terintegrasi.

## 🎯 Fitur Utama

### ✨ Dashboard Modern
- UI modern dengan glass-morphism effects dan animasi
- Real-time statistics dan monitoring
- Dark/Light theme support
- Responsive design untuk semua device

### 👥 Manajemen Jamaah
- Input data jamaah (manual & import Excel)
- Validasi otomatis NIK, paspor, dan data personal
- Upload dan verifikasi dokumen
- Tracking status verifikasi
- Relasi mahram untuk jamaah wanita
- Catatan medis dan status lansia

### 📦 Manajemen Paket Umroh
- CRUD paket umroh lengkap
- Detail hotel Makkah & Madinah
- Informasi maskapai dan penerbangan
- Tracking sisa seat tersedia
- Harga dan durasi paket

### 💰 Manajemen Pembayaran
- Recording pembayaran dengan bukti
- Verifikasi pembayaran oleh tim keuangan
- Tracking status pembayaran per jamaah
- Laporan keuangan dan revenue

### 📋 Manajemen Keberangkatan
- Pembentukan grup/rombongan
- Alokasi bus dan meeting point
- Rooming list dan manifest
- Tracking status keberangkatan

### 📊 Reporting & Analytics
- Dashboard statistik real-time
- Export data ke Excel/PDF
- Laporan keuangan, jamaah, dan operasional
- Visualisasi data dengan charts

### 🔐 Security & Audit
- Role-based access control
- Activity logging semua aksi user
- Audit trail untuk perubahan data
- Soft-delete dengan history
- Auto backup database

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern functional components
- **Material-UI v5** - Modern component library
- **Framer Motion** - Smooth animations
- **SheetJS (XLSX)** - Excel import/export
- **Chart.js** - Data visualization

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MySQL** - Primary database
- **JWT** - Authentication
- **Multer** - File uploads
- **Socket.IO** - Real-time features

### Security
- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - DDoS protection
- **bcryptjs** - Password hashing
- **Joi** - Input validation

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd aplikasi-umroh
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize MySQL database
npm run init-db

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Database Setup

#### Option A: Auto Initialize (Recommended)
```bash
cd backend
npm run init-db
```

#### Option B: Manual Setup
1. Create MySQL database: `umroh_management`
2. Import schema: `mysql -u root -p umroh_management < database/schema.sql`

### 5. Default Login
```
Username: admin
Password: admin123
Email: admin@umroh.com
```

## 📁 Project Structure

```
aplikasi-umroh/
├── backend/                 # Node.js API server
│   ├── config/             # Database & app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── scripts/           # Utility scripts
│   └── uploads/           # File storage
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── theme/         # Material-UI theme
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── database/               # Database schema & migrations
└── docs/                  # Documentation
```

## 🔧 Available Scripts

### Backend
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm run init-db    # Initialize MySQL database
npm run backup     # Create database backup
npm test           # Run tests
```

### Frontend
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
npm run analyze    # Bundle analyzer
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Jamaah Management
- `GET /api/jamaah` - List jamaah with filters
- `POST /api/jamaah` - Create new jamaah
- `GET /api/jamaah/:id` - Get jamaah details
- `PUT /api/jamaah/:id` - Update jamaah
- `DELETE /api/jamaah/:id` - Soft delete jamaah

### Package Management
- `GET /api/packages` - List packages
- `POST /api/packages` - Create package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

### Payment Management
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `PUT /api/payments/:id/verify` - Verify payment

### Excel Operations
- `POST /api/excel/import/jamaah` - Import jamaah from Excel
- `GET /api/excel/export/jamaah` - Export jamaah to Excel
- `GET /api/excel/template/jamaah` - Download Excel template

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/jamaah` - Jamaah reports
- `GET /api/reports/payments` - Payment reports
- `GET /api/reports/packages` - Package reports

## 👥 User Roles & Permissions

### Admin
- Full system access
- User management
- System configuration
- All CRUD operations

### Marketing
- Jamaah registration
- Package viewing
- Lead management

### Keuangan (Finance)
- Payment verification
- Financial reports
- Revenue tracking

### Tim Visa
- Document verification
- Visa status updates
- Document management

### Operator Keberangkatan
- Group management
- Departure planning
- Manifest creation

### Tim Hotel & Ticketing
- Room allocation
- Seat assignment
- Booking management

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-based Access** - Granular permissions
- **Activity Logging** - All actions tracked
- **Data Validation** - Input sanitization
- **File Upload Security** - Type & size validation
- **Rate Limiting** - DDoS protection
- **SQL Injection Prevention** - Parameterized queries

## 📊 Business Process Flows

### 1. Jamaah Registration Flow
1. **Input** - Marketing inputs jamaah data (form/Excel)
2. **Validation** - System validates NIK, passport, format
3. **Storage** - Data saved to central database
4. **Verification** - Admin/supervisor verifies data
5. **Confirmation** - Jamaah status updated to verified

### 2. Payment Processing Flow
1. **Recording** - Finance team records payment with receipt
2. **Verification** - Payment verification by authorized personnel
3. **Update** - Jamaah payment status automatically updated
4. **Reporting** - Payment reflected in financial reports

### 3. Departure Management Flow
1. **Grouping** - Operator creates departure groups
2. **Assignment** - Jamaah assigned to groups and transport
3. **Documentation** - Generate rooming lists and manifests
4. **Tracking** - Monitor departure status and logistics

## 🎯 Success Metrics

- **Entry Speed** - Jamaah entry < 3 minutes
- **Import Success** - >95% Excel import success rate
- **Data Accuracy** - Duplication < 0.5%
- **System Performance** - Response time < 5 seconds
- **Validation** - 100% automatic validation of key fields
- **Scalability** - Handle 50,000 jamaah/year

## 🔄 Backup & Recovery

- **Automatic Backups** - Daily database backups
- **Retention Policy** - 30 days backup retention
- **Recovery Scripts** - One-click restore functionality
- **Data Integrity** - Regular consistency checks

## 📞 Support & Maintenance

### Development Team
- Backend API development
- Frontend React development
- Database management
- Security implementation

### Deployment
- Docker containerization ready
- Cloud deployment compatible
- Scalable infrastructure
- Monitoring and logging

## 📄 License

This project is proprietary software for internal use.

---

**🚀 Built with modern technologies for efficiency, security, and scalability**