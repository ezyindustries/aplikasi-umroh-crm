# 📋 Port Management System - Aplikasi Umroh

## Quick Reference

### ✅ Active Ports (Currently Used)
```
Backend API:  http://localhost:3000
PostgreSQL:   localhost:5432
Redis Cache:  localhost:6379  
Frontend UI:  http://localhost:8081
```

## 📁 Port Management Files

1. **PORT-ALLOCATION.md** - Complete port registry and documentation
2. **backend/config/ports.js** - Centralized port configuration for Node.js
3. **scripts/check-ports.js** - Port availability checker utility
4. **scripts/port-status.bat** - Windows batch script for port status

## 🔧 How to Use

### Before Adding New Service:
```bash
# 1. Check PORT-ALLOCATION.md for available ports

# 2. Run port checker to verify availability
node scripts/check-ports.js

# 3. Check specific port
node scripts/check-ports.js --check 3002

# 4. Find available port in range
node scripts/check-ports.js --find 3000 3999
```

### After Adding New Service:
1. Update `PORT-ALLOCATION.md` with new port allocation
2. Update `backend/config/ports.js` if it's a backend service
3. Update `.env` and `docker-compose.yml` as needed
4. Commit with message: "Add port allocation for [service-name]"

## 🚀 Common Commands

```bash
# Check all Docker port mappings
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Check if specific port is in use (Windows)
netstat -an | findstr :3000

# Run port status check (Windows)
scripts\port-status.bat

# Import port config in Node.js
const { ports, validatePort } = require('./config/ports');
```

## ⚠️ Important Notes

- Always check port availability before starting new services
- Use designated port ranges (see PORT-ALLOCATION.md)
- Avoid reserved ports (80, 443, 3306, 8080, etc.)
- Document all port changes immediately

## 🔗 Integration with Application

The port configuration is integrated with:
- Docker Compose services
- Environment variables (.env)
- Backend server configuration
- Health check endpoints
- Testing utilities

For detailed information, see `PORT-ALLOCATION.md`