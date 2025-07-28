# WhatsApp Business API Compliance Guide

## Implementasi Kepatuhan WhatsApp Business

Sistem ini telah diimplementasikan dengan mempertimbangkan aturan WhatsApp Business API untuk memastikan kepatuhan penuh.

## 1. Aturan yang Diimplementasikan

### A. Opt-in Requirements ✅
- **Aturan**: Semua kontak HARUS memberikan persetujuan eksplisit sebelum menerima pesan bisnis
- **Implementasi**:
  - Field `optInStatus` di database Contact
  - Tidak ada auto-sync semua kontak
  - Hanya menampilkan kontak yang sudah opt-in atau punya conversation aktif
  - Tracking opt-in date dan method

### B. 24-Hour Conversation Window ✅
- **Aturan**: Pesan free-form hanya bisa dikirim dalam 24 jam setelah customer mengirim pesan
- **Implementasi**:
  - Model `ConversationSession` tracking window
  - Automatic window checking sebelum kirim pesan
  - Template message requirement di luar window

### C. Rate Limiting ✅
- **Aturan**: Batasan pesan per tier bisnis
- **Implementasi**:
  ```
  Tier 1: 1,000 business-initiated conversations/day
  Tier 2: 10,000 conversations/day  
  Tier 3: 100,000 conversations/day
  ```
  - Rate limiter dengan Redis
  - Per-user message limits
  - Unique user tracking

### D. Message Types ✅
- **Aturan**: Distinguish antara customer-initiated vs business-initiated
- **Implementasi**:
  - Tracking message direction
  - Different rules untuk setiap type
  - Template requirement untuk business-initiated

## 2. Compliance Service Features

### ComplianceService.js
```javascript
// Check sebelum kirim pesan
const compliance = await complianceService.canSendMessage(contactId);
if (!compliance.allowed) {
  // Block message
}

// Process opt-in
await complianceService.processOptIn(contactId, 'website');

// Process opt-out  
await complianceService.processOptOut(contactId);
```

## 3. Data Privacy & Security

### A. Data Protection
- Encryption untuk sensitive data
- Secure session management
- No storage of unnecessary data

### B. User Rights
- Right to opt-out
- Right to data deletion
- Data portability

## 4. Quality Rating Protection

### Factors yang Dimonitor:
1. **Response Time** - Balas pesan customer cepat
2. **Block Rate** - Hindari di-block user
3. **Report Rate** - Hindari di-report spam
4. **Message Quality** - Kirim konten relevan

## 5. Best Practices

### DO ✅
- Always get explicit opt-in
- Respect 24-hour window
- Use approved templates
- Monitor quality metrics
- Respond quickly to customers

### DON'T ❌
- Auto-import all contacts
- Send unsolicited messages
- Spam or excessive marketing
- Use for prohibited content
- Ignore opt-out requests

## 6. Template Messages

Untuk pesan di luar 24-hour window, gunakan template yang sudah di-approve:

```javascript
// Example template
{
  name: "appointment_reminder",
  language: "id",
  category: "APPOINTMENT_UPDATE",
  components: [{
    type: "body",
    text: "Halo {{1}}, pengingat untuk janji temu Anda pada {{2}} jam {{3}}."
  }]
}
```

## 7. Monitoring & Reporting

### Dashboard Metrics:
- Daily message count vs limits
- Opt-in/out rates
- 24-hour window status
- Template vs free-form ratio
- Quality rating indicators

## 8. WAHA vs Official API

**PENTING**: Sistem ini menggunakan WAHA (WhatsApp Web) yang berbeda dengan Official WhatsApp Business API:

### WAHA Limitations:
- Tidak ada official support dari Meta
- Risiko banned lebih tinggi
- Tidak ada template message system
- Limited to WhatsApp Web features

### Rekomendasi:
Untuk production dengan volume tinggi (50,000/tahun), sangat disarankan migrate ke:
1. **WhatsApp Business API** (official)
2. **WhatsApp Cloud API** (Meta hosted)
3. **Business Solution Provider** (BSP)

## 9. Compliance Checklist

- [ ] Implement opt-in mechanism
- [ ] Track 24-hour windows
- [ ] Rate limiting active
- [ ] Template system ready
- [ ] Quality monitoring
- [ ] Privacy policy updated
- [ ] Terms of service clear
- [ ] Audit logging enabled
- [ ] Backup procedures
- [ ] Incident response plan

## 10. Contact for Official API

Untuk upgrade ke Official WhatsApp Business API:
1. Visit: https://www.whatsapp.com/business/api
2. Choose a Business Solution Provider
3. Apply for WhatsApp Business Account
4. Get verified (Business Verification)
5. Submit message templates for approval

---

**Note**: Compliance adalah ongoing process. Regular review dan updates diperlukan untuk maintain good standing dengan WhatsApp/Meta.