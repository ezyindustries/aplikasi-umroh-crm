# How to Find Your WAHA Plus Credentials

## Where to Look

### 1. Email Search
Search your email for:
- From: "noreply@devlike.pro" or "support@devlike.pro"
- Subject: "WAHA Plus", "License", "Access", "Credentials"
- Also check: Spam/Junk folder

### 2. What the Email Looks Like
```
Subject: Your WAHA Plus Access Details

Dear Customer,

Thank you for purchasing WAHA Plus! Here are your access details:

Docker Hub Access:
Username: waha-customer-12345
Password: AbCdEfGhIjKlMnOp

License Key: WAHA-PLUS-ABCD-1234-EFGH-5678

Installation Guide: [link]
```

### 3. If Can't Find Email

#### Option A: Check Payment Receipt
- PayPal/Stripe receipt might have order number
- Use order number to recover credentials

#### Option B: Login to WAHA Dashboard
- Go to: https://waha.devlike.pro/
- Login with purchase email
- Check "My Licenses" or "Downloads"

#### Option C: Contact Support
Email to: support@devlike.pro
Subject: WAHA Plus Credentials Recovery

Include:
- Purchase date
- Email used for purchase
- Payment method (PayPal/Card)
- Order/Transaction ID if available

## Common Issues

### "I only have license key, no Docker credentials"
- Older purchases might only have license key
- Email support@devlike.pro for Docker access

### "Email shows different format"
Credentials might be formatted as:
- Registry: docker.io
- Namespace: devlikeapro
- Repository: waha-plus
- Username: [provided]
- Password: [provided]

### "I bought through reseller"
- Contact your reseller for credentials
- Or contact WAHA support with proof of purchase

## Quick Check

Run this to see if you're logged in correctly:
```bash
docker pull devlikeapro/waha-plus:latest
```

If it says "pull access denied" = Wrong/No credentials
If it starts downloading = Correct credentials

## Next Steps

Once you have credentials:

1. Run: `FIX-WAHA-DOCKER-LOGIN.bat`
2. Enter WAHA credentials (not personal)
3. Then run: `INSTALL-WAHA-PLUS-LICENSE.bat`