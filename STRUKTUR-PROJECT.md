# 📁 Struktur Project Aplikasi Umroh

## 🗂️ Root Directory
```
📦 aplikasi umroh/
├── 📄 CLAUDE.md                    # Project requirements & AI instructions
├── 📄 MULAI-DISINI.txt             # Quick start guide (Indonesian)
├── 📄 README-DEMO.md               # Detailed demo documentation
├── 📄 STRUKTUR-PROJECT.md          # This file - project structure
├── 🚀 JALANKAN-APLIKASI.bat        # Main startup script
├── 🔧 setup-database.bat           # Database setup only
├── 📂 backend/                     # Node.js backend server
├── 📂 frontend/                    # React frontend app
└── 📂 exports/                     # Generated export files
```

## 🔧 Backend Structure
```
📂 backend/
├── 📄 server.js                    # Main server entry point
├── 📄 package.json                 # Dependencies & scripts
├── 💾 database.db                  # SQLite database (auto-created)
│
├── 📂 config/                      # Configuration files
│   ├── database.js                 # Database connection & queries
│   ├── security.js                 # Security validation
│   └── logging.js                  # Winston logger setup
│
├── 📂 controllers/                 # Request handlers
│   ├── jamaahController.js         # Jamaah CRUD operations
│   ├── packageController.js        # Package management
│   ├── paymentController.js        # Payment processing
│   ├── documentController.js       # File upload/management
│   └── ...                         # Other controllers
│
├── 📂 middleware/                  # Express middleware
│   ├── auth.js                     # Authentication & authorization
│   ├── upload.js                   # File upload handling
│   ├── securityMiddleware.js       # Security headers & rate limiting
│   └── ...                         # Other middleware
│
├── 📂 models/                      # Data models
│   ├── User.js                     # User model & validation
│   ├── Jamaah.js                   # Jamaah model
│   ├── Package.js                  # Package model
│   └── ...                         # Other models
│
├── 📂 routes/                      # API routes
│   ├── auth.js                     # Authentication endpoints
│   ├── jamaah.js                   # Jamaah API endpoints
│   ├── notifications.js            # WebSocket notifications
│   └── ...                         # Other routes
│
├── 📂 services/                    # Business logic
│   ├── websocketService.js         # Real-time WebSocket handling
│   ├── notificationService.js      # Notification management
│   ├── exportImportService.js      # Excel import/export
│   └── ...                         # Other services
│
├── 📂 migrations/                  # Database schema (SQLite)
│   ├── 001_create_users_sqlite.sql
│   ├── 002_create_packages_sqlite.sql
│   └── ...                         # Other migrations
│
├── 📂 scripts/                     # Utility scripts
│   └── simple-init.js              # Database initialization
│
└── 📂 uploads/                     # Uploaded files storage
    ├── documents/                  # Jamaah documents
    ├── photos/                     # Profile photos
    └── temp/                       # Temporary files
```

## ⚛️ Frontend Structure
```
📂 frontend/
├── 📄 package.json                 # React dependencies
├── 📂 public/
│   └── index.html                  # HTML template
│
└── 📂 src/
    ├── 📄 App.js                   # Main app component
    ├── 📄 index.js                 # React entry point
    │
    ├── 📂 components/              # Reusable components
    │   ├── Layout.js               # Main layout wrapper
    │   ├── ProtectedRoute.js       # Auth protection
    │   │
    │   ├── 📂 activity/            # Activity components
    │   │   └── ActivityFeed.js     # Real-time activity feed
    │   │
    │   ├── 📂 common/              # Common UI components
    │   │   ├── DataTable.js        # Reusable data table
    │   │   ├── FileUpload.js       # File upload widget
    │   │   └── SearchFilter.js     # Search & filter
    │   │
    │   ├── 📂 excel/               # Excel import/export
    │   │   ├── ExcelImportDialog.js
    │   │   └── ExcelExportDialog.js
    │   │
    │   ├── 📂 forms/               # Form components
    │   │   └── JamaahForm.js       # Jamaah registration form
    │   │
    │   ├── 📂 notifications/       # Notification components
    │   │   ├── NotificationCenter.js # Notification dropdown
    │   │   └── NotificationToast.js  # Toast notifications
    │   │
    │   └── 📂 payments/            # Payment components
    │       └── PaymentForm.js      # Payment input form
    │
    ├── 📂 contexts/                # React contexts
    │   └── WebSocketContext.js     # WebSocket state management
    │
    ├── 📂 hooks/                   # Custom React hooks
    │   └── useAuth.js              # Authentication hook
    │
    ├── 📂 pages/                   # Page components
    │   ├── LoginPage.js            # Login screen
    │   ├── DashboardPage.js        # Main dashboard
    │   ├── JamaahListPage.js       # Jamaah listing
    │   ├── PackagesPage.js         # Package management
    │   ├── PaymentsPage.js         # Payment tracking
    │   ├── DocumentsPage.js        # Document management
    │   ├── ReportsPage.js          # Analytics & reports
    │   └── ...                     # Other pages
    │
    ├── 📂 services/                # API services
    │   └── api.js                  # API client configuration
    │
    └── 📂 styles/                  # CSS styles
        └── index.css               # Global styles
```

## 🚀 Quick Start Files

### Essential Files untuk Demo:
1. **JALANKAN-APLIKASI.bat** - Startup script utama
2. **MULAI-DISINI.txt** - Panduan singkat
3. **setup-database.bat** - Setup database saja (troubleshooting)

### Konfigurasi:
- **backend/.env** - Environment variables
- **frontend/.env** - React environment

### Database:
- **backend/database.db** - SQLite database (auto-created)
- **backend/scripts/simple-init.js** - Database initialization

## 🔧 Teknologi yang Digunakan

### Backend:
- **Node.js** + **Express.js** - Web server
- **SQLite** - Database (untuk demo)
- **Socket.io** - Real-time WebSocket
- **JWT** - Authentication
- **Winston** - Logging
- **Multer** - File upload

### Frontend:
- **React** - UI framework
- **Material-UI** - Component library
- **Socket.io-client** - WebSocket client
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Recharts** - Charts & visualization

## 📊 Fitur Utama

✅ **Real-time Notifications** - WebSocket bidirectional
✅ **Activity Feed** - Live activity monitoring
✅ **Excel Import/Export** - Bulk data operations
✅ **File Upload** - Document management
✅ **Authentication** - Role-based access
✅ **Dashboard Analytics** - Interactive charts
✅ **Responsive Design** - Mobile-friendly UI

---

## 🎯 Development Notes

- Project structure telah dibersihkan dari file duplikat
- Hanya file essential yang tersisa
- Database menggunakan SQLite untuk kemudahan demo
- Ready untuk production dengan minimal changes
- Dokumentasi lengkap tersedia di README-DEMO.md