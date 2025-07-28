# Network Access Guide for CRM Dashboard

## Overview
This guide explains how to access the CRM dashboard from other devices on your network or from the internet.

## Quick Start

### 1. Use the No-Login Version
Access the CRM dashboard without authentication:
```
http://localhost:5000/frontend/crm-no-login.html
```

### 2. Find Your Computer's IP Address

#### Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

#### Mac/Linux:
```bash
ifconfig
# or
ip addr
```

### 3. Start the Backend Server
```bash
cd backend
npm run dev
```

The server will run on port 5000 by default.

## Accessing from Other Devices

### On the Same Network (LAN):

1. **From another computer/phone on the same WiFi:**
   ```
   http://YOUR_COMPUTER_IP:5000/frontend/crm-no-login.html
   ```
   Example: `http://192.168.1.100:5000/frontend/crm-no-login.html`

2. **Configure Windows Firewall:**
   - Open Windows Defender Firewall
   - Click "Allow an app or feature"
   - Add Node.js
   - Allow both Private and Public networks

3. **Configure the API URLs in Settings:**
   - Backend API: `http://YOUR_COMPUTER_IP:5000/api`
   - WAHA URL: `http://YOUR_COMPUTER_IP:3001`

### From the Internet (Remote Access):

#### Option 1: Port Forwarding (Advanced)
1. Access your router's admin panel (usually 192.168.1.1)
2. Find "Port Forwarding" or "Virtual Server"
3. Add rules:
   - External Port: 5000 → Internal IP: YOUR_COMPUTER_IP → Internal Port: 5000
   - External Port: 3001 → Internal IP: YOUR_COMPUTER_IP → Internal Port: 3001
4. Access using your public IP: `http://YOUR_PUBLIC_IP:5000/frontend/crm-no-login.html`

#### Option 2: Using ngrok (Easier)
1. Download ngrok from https://ngrok.com
2. Install and authenticate
3. Run:
   ```bash
   ngrok http 5000
   ```
4. Use the provided URL (e.g., `https://abc123.ngrok.io/frontend/crm-no-login.html`)

#### Option 3: Using Cloudflare Tunnel (Most Secure)
1. Install cloudflared
2. Run:
   ```bash
   cloudflared tunnel --url http://localhost:5000
   ```
3. Use the provided URL

## Security Considerations

### For LAN Access:
- No major security concerns if you trust all devices on your network
- The no-login version has no authentication, so anyone can access it

### For Internet Access:
1. **USE HTTPS**: Get an SSL certificate or use services like ngrok/Cloudflare that provide HTTPS
2. **Add Authentication**: Don't expose the no-login version to the internet
3. **Use a VPN**: Consider setting up a VPN server instead of direct exposure
4. **Firewall Rules**: Only allow specific IPs if possible

## Troubleshooting

### Can't Access from Other Devices:

1. **Check if server is running:**
   ```bash
   netstat -an | findstr :5000
   ```

2. **Check Windows Firewall:**
   - Temporarily disable to test
   - If it works, add proper firewall rules

3. **Check if using correct IP:**
   - Don't use `localhost` or `127.0.0.1` from other devices
   - Use the actual network IP

### CORS Errors:

1. **Update backend CORS settings:**
   Edit `backend/config/security.js`:
   ```javascript
   allowedOrigins: ['http://localhost:3000', 'http://YOUR_IP:5000', '*']
   ```

2. **Or use the Settings page** in the dashboard to configure API URLs properly

### WhatsApp Won't Connect:

1. Ensure WAHA is accessible:
   ```bash
   docker run -p 3001:3000 devlikeapro/waha
   ```

2. Update WAHA URL in settings to use your network IP

## Best Practices

### For Development:
- Use `crm-no-login.html` for easy testing
- Configure all URLs in the Settings page
- Use your local network IP

### For Production:
1. Use proper authentication
2. Set up HTTPS with SSL certificates
3. Use a reverse proxy (nginx)
4. Implement proper security headers
5. Use environment variables for configuration

## Example nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Mobile App Alternative

For better mobile experience, consider:
1. Creating a Progressive Web App (PWA)
2. Using a WebView in a native app
3. Building a React Native app that consumes the same API

## Summary

The `crm-no-login.html` file is designed to work without authentication and can be accessed from any device once you:
1. Configure the correct API URLs
2. Ensure the backend is accessible
3. Open the necessary firewall ports

For production use, always add proper authentication and use HTTPS!