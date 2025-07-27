# Port Allocation Registry - Aplikasi Umroh

## 📋 Port Usage Documentation
Last Updated: 2025-07-27

### ✅ Currently Allocated Ports

| Port | Service | Container Name | Description | Status |
|------|---------|----------------|-------------|---------|
| 3000 | Backend API | vauza-tamma-backend | Node.js Express API Server | ✅ Active |
| 5432 | PostgreSQL | vauza-tamma-db | Main database server | ✅ Active |
| 6379 | Redis | vauza-tamma-redis | Cache & session storage | ✅ Active |
| 8081 | Frontend | vauza-tamma-frontend | Nginx static file server | ✅ Active |

### 🔄 Optional/Conditional Ports

| Port | Service | Container Name | Description | Status |
|------|---------|----------------|-------------|---------|
| 3001 | WAHA WhatsApp | vauza-tamma-waha | WhatsApp automation API | ⏸️ Optional (profile: waha) |

### 📝 Port Allocation Rules

1. **Check this file first** before allocating any new port
2. **Standard ranges**:
   - Development services: 3000-3999
   - Databases: 5000-5999
   - Cache/Queue services: 6000-6999
   - Frontend/UI services: 8000-8999
   - Testing/Debug services: 9000-9999

3. **Naming convention**: 
   - Use descriptive service names
   - Include container name for Docker services
   - Mark status clearly (Active/Inactive/Optional)

### 🚫 Reserved Ports (Do Not Use)

| Port | Reason |
|------|---------|
| 80 | Standard HTTP (may conflict with other services) |
| 443 | Standard HTTPS (may conflict with other services) |
| 3306 | MySQL default (avoid confusion, we use PostgreSQL) |
| 8080 | Common development port (avoid conflicts) |

### 📌 Environment Configuration

Current `.env` settings:
```
PORT=3000                 # Backend API
DB_PORT=5432             # PostgreSQL
REDIS_PORT=6379          # Redis
FRONTEND_PORT=8081       # Frontend Nginx
WAHA_PORT=3001          # WhatsApp API (optional)
```

Docker Compose port mappings:
```yaml
backend:  "3000:3000"    # Host:Container
postgres: "5432:5432"    
redis:    "6379:6379"    
frontend: "8081:80"      
waha:     "3001:3000"    # When enabled
```

### 🔧 How to Add New Service

1. Check this file for available ports
2. Choose port from appropriate range
3. Update this file with:
   - Port number
   - Service name
   - Container name (if Docker)
   - Description
   - Status
4. Update `.env` and `docker-compose.yml` as needed
5. Commit changes with message: "Add port allocation for [service-name]"

### 📊 Port Usage Summary

- **Total Allocated**: 4 active + 1 optional
- **Available Ranges**: 
  - Dev: 3002-3999 (except 3001)
  - DB: 5433-5999
  - Cache: 6380-6999
  - Frontend: 8082-8999
  - Testing: 9000-9999

### 🔍 Quick Check Commands

```bash
# Check if port is in use (Windows)
netstat -an | findstr :PORT_NUMBER

# Check if port is in use (Linux/Mac)
lsof -i :PORT_NUMBER

# Check Docker port mappings
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Check all listening ports
netstat -tulpn | grep LISTEN
```

### 📝 Change Log

- 2025-07-27: Initial port allocation documentation
- 2025-07-27: Backend moved from 5000 to 3000
- 2025-07-27: Frontend confirmed on 8081