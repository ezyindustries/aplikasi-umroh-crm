# Vauza Tamma Management System - Technical Documentation

## Overview
Vauza Tamma Management System adalah aplikasi komprehensif untuk mengelola jamaah umroh dengan kapasitas hingga 50.000 jamaah per tahun. Sistem ini mencakup manajemen jamaah, keuangan, marketing, dan otomasi WhatsApp.

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (SPA), HTML5, CSS3 with Glass Morphism design
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL with Sequelize ORM
- **Cache**: Redis for session storage and caching
- **Containerization**: Docker with docker-compose
- **Reverse Proxy**: Nginx
- **WhatsApp Integration**: WAHA (WhatsApp HTTP API)

### System Architecture
```
[Frontend (Nginx)] ↔ [Backend API (Node.js)] ↔ [Database (PostgreSQL)]
                                            ↔ [Redis Cache]
                                            ↔ [WAHA Service]
```

## Database Schema

### Core Tables
1. **users** - User authentication and authorization
2. **jamaah** - Jamaah (pilgrims) data management
3. **packages** - Umroh package definitions
4. **groups** - Departure groups
5. **subgroups** - Sub-groups within main groups
6. **payments** - Payment tracking and verification
7. **documents** - Document storage (KTP, Passport, etc.)

### Financial Tables
8. **chart_of_accounts** - Chart of accounts for financial reporting
9. **finance_transactions** - All financial transactions with double-entry bookkeeping

### Marketing Tables
10. **leads** - WhatsApp leads tracking
11. **campaigns** - Marketing campaign management
12. **automation_rules** - Automation rules for WhatsApp
13. **message_templates** - Message templates for automation
14. **message_queue** - Message queue for sending WhatsApp messages

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /logout` - User logout

### Jamaah Management (`/api/jamaah`)
- `GET /` - Get all jamaah with pagination and filters
- `POST /` - Create new jamaah
- `GET /:id` - Get specific jamaah details
- `PUT /:id` - Update jamaah data
- `DELETE /:id` - Soft delete jamaah
- `POST /import` - Import jamaah from Excel
- `GET /export` - Export jamaah to Excel/PDF

### Package Management (`/api/packages`)
- `GET /` - Get all packages
- `POST /` - Create new package
- `GET /:id` - Get package details
- `PUT /:id` - Update package
- `DELETE /:id` - Delete package

### Group Management (`/api/groups`)
- `GET /` - Get all groups
- `POST /` - Create new group
- `GET /:id` - Get group details with jamaah
- `PUT /:id` - Update group
- `POST /:id/subgroups` - Create subgroup
- `PUT /:groupId/subgroups/:subgroupId` - Update subgroup
- `POST /:groupId/assign-jamaah` - Assign jamaah to subgroup

### Payment Management (`/api/payments`)
- `GET /` - Get all payments with filters
- `POST /` - Create new payment
- `PUT /:id/verify` - Verify payment
- `PUT /:id/reject` - Reject payment
- `GET /jamaah/:jamaahId` - Get payments for specific jamaah

### Financial Reports (`/api/finance`)
- `GET /dashboard` - Financial dashboard data
- `GET /balance-sheet` - Balance sheet report
- `GET /income-statement` - Income statement
- `GET /cash-flow` - Cash flow statement
- `GET /journal` - General journal
- `GET /ledger` - General ledger
- `POST /transactions` - Create manual transaction
- `GET /coa` - Chart of accounts

### Marketing Tools (`/api/marketing`)
- `GET /dashboard` - Marketing dashboard
- `GET /leads` - Get all leads
- `POST /leads` - Create new lead
- `PUT /leads/:id` - Update lead status
- `GET /campaigns` - Get campaigns
- `POST /campaigns` - Create campaign
- `GET /analytics` - Marketing analytics

### WhatsApp Automation (`/api/automation`)
- `GET /rules` - Get automation rules
- `POST /rules` - Create automation rule
- `PUT /rules/:id` - Update rule
- `GET /templates` - Get message templates
- `POST /templates` - Create template
- `GET /queue` - Get message queue
- `POST /send` - Send immediate message
- `POST /webhook` - WAHA webhook endpoint

## Environment Configuration

### Required Environment Variables
```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=vauza_tamma_db
DB_USER=postgres
DB_PASSWORD=your-secure-password

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:8080

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# WAHA (Optional)
WAHA_URL=http://waha:3000
WAHA_SESSION=default
```

## Docker Deployment

### Services
1. **postgres** - PostgreSQL database
2. **redis** - Redis cache
3. **backend** - Node.js API server
4. **frontend** - Nginx web server
5. **waha** - WhatsApp HTTP API (optional)

### Commands
```bash
# Start all services
docker-compose up -d

# Start without WAHA
docker-compose up -d postgres redis backend frontend

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

## Development Workflow

### 1. Frontend Development
- Edit `demo-complete-umroh-app.html`
- Test in browser locally
- Ensure API integration works

### 2. Backend Development
- Create/modify API endpoints in `routes/`
- Update database models in `models/`
- Test API with tools like Postman

### 3. Database Changes
- Modify models in `models/` directory
- Run migration: `npm run migrate`
- Update seed data if needed: `npm run seed`

### 4. Testing
- Run Docker environment: `docker-compose up -d`
- Test frontend functionality
- Test API endpoints
- Verify database operations

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (admin, operator, viewer)
- Token expiration handling
- Password hashing with bcrypt

### Data Security
- Input validation and sanitization
- SQL injection prevention via Sequelize ORM
- XSS protection with helmet middleware
- Rate limiting for API endpoints

### Audit Trail
- User activity logging
- Data change tracking
- Soft delete for critical data
- Payment verification workflow

## Performance Optimizations

### Database
- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization with includes and attributes

### Caching
- Redis for session storage
- API response caching for static data
- Browser caching for static assets

### Frontend
- Single Page Application (SPA) design
- Lazy loading for large datasets
- Optimized DOM manipulation
- Debounced search functionality

## Monitoring & Maintenance

### Health Checks
- Database connection monitoring
- API endpoint health checks
- Service availability monitoring

### Backup Strategy
- Automated daily database backups
- File storage backups
- Point-in-time recovery capability

### Logging
- Application logs with Winston
- Error tracking and notification
- User activity logs
- Performance monitoring

## Financial Module Details

### Chart of Accounts Structure
```
1000 - ASET
  1100 - Kas dan Bank
    1101 - Kas
    1102 - Bank
  1200 - Piutang
    1201 - Piutang Jamaah

2000 - KEWAJIBAN
  2100 - Utang Lancar
    2101 - Utang Usaha

3000 - MODAL
  3100 - Modal Pemilik

4000 - PENDAPATAN
  4100 - Pendapatan Umroh
    4101 - Pendapatan Paket Umroh

5000 - BEBAN
  5100 - Beban Operasional
    5101 - Beban Hotel
    5102 - Beban Transportasi
    5103 - Beban Visa
```

### Automatic Posting Rules
1. **Payment Verification**: 
   - Debit: 1102 (Bank)
   - Credit: 1201 (Piutang Jamaah)

2. **Revenue Recognition**:
   - Debit: 1201 (Piutang Jamaah)
   - Credit: 4101 (Pendapatan Paket Umroh)

3. **Expense Recording**:
   - Debit: 5xxx (Beban accounts)
   - Credit: 1102 (Bank) or 2101 (Utang Usaha)

## Marketing Module Details

### Lead Tracking
- WhatsApp number as primary identifier
- Lead scoring based on engagement
- Conversion funnel tracking
- Source attribution

### Campaign Management
- Multi-channel campaign support
- ROI calculation
- Target vs actual performance
- Budget tracking

### Automation Features
- Rule-based message triggers
- Template-based messaging
- Scheduled message delivery
- Performance analytics

## WhatsApp Integration

### WAHA Configuration
- Session management
- Webhook handling
- Message queue processing
- Media support (text, images, documents)

### Automation Rules
- Trigger types: new_lead, payment_reminder, follow_up, birthday
- Action types: send_message, create_task, update_status
- Conditional logic support
- Delay and scheduling options

## Troubleshooting

### Common Issues
1. **Database Connection Failed**
   - Check PostgreSQL service status
   - Verify environment variables
   - Check network connectivity

2. **Authentication Errors**
   - Verify JWT_SECRET configuration
   - Check token expiration
   - Validate user status

3. **WhatsApp Integration Issues**
   - Check WAHA service status
   - Verify webhook configuration
   - Check message queue processing

### Debug Commands
```bash
# Check container logs
docker-compose logs backend
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d vauza_tamma_db

# Check API health
curl http://localhost:3000/api/health

# Check frontend
curl http://localhost:8080/health
```

## Support & Maintenance

### Regular Maintenance Tasks
1. Database backup verification
2. Log file cleanup
3. Performance monitoring
4. Security updates
5. User access review

### Contact & Support
- System Administrator: admin@vauza-tamma.com
- Technical Support: support@vauza-tamma.com
- Documentation Updates: docs@vauza-tamma.com

---

*Document Version: 1.0*  
*Last Updated: 2024-07-22*  
*System Version: 1.0.0*