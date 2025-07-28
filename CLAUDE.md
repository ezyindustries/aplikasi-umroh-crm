# Aplikasi Manajemen Umroh – Requirements & AI Prompt

## 1. Executive Summary
Aplikasi ini bertujuan menjadi pusat kendali data jamaah umroh dalam skala besar (target: 50.000/tahun), agar tim internal dapat menginput, melacak, dan mengelola informasi jamaah secara efisien, akurat, dan terdokumentasi. Saat ini, proses manual dan file terpisah menyebabkan pencarian sulit, duplikasi data, dan risiko kesalahan tinggi. Solusi ini dibangun untuk memberdayakan semua peran tim (admin, marketing, visa, keberangkatan, keuangan, dsb) dalam satu platform kolaboratif.

## 2. Business Objectives & Success Metrics
- Objective 1: Mempercepat input data jamaah
  - Success Metric: Entry < 3 menit, >95% sukses import via Excel
- Objective 2: Mengurangi human error
  - Success Metric: Duplikasi < 0.5%, validasi otomatis semua field utama
- Objective 3: Menyediakan laporan dan visualisasi
  - Success Metric: 5 laporan utama, waktu respon < 5 detik
- Objective 4: Input massal via Excel
  - Success Metric: >80% input pakai template, error minor
- Objective 5: Dapat menangani 50.000 jamaah per tahun
  - Success Metric: Sistem tetap stabil, dievaluasi langsung oleh owner

## 3. Business Process Flows  
Kategori Aplikasi: Manajemen Jamaah Umroh  
Aktor & Flow:

### Aktor:
- Admin
- Marketing
- Keuangan
- Operator Keberangkatan
- Tim Visa
- Tim Ticketing
- Tim Hotel

### Alur Utama: *Pendaftaran dan Manajemen Jamaah*

#### Input:
- Data dari form atau Excel: identitas, paspor, paket, dokumen
- Diupload oleh berbagai role: Admin, Marketing, dsb

#### Proses:
- Validasi: NIK 16 digit, paspor unik, format file benar
- Simpan ke database pusat terstruktur
- Logging semua aktivitas (by role, time, IP)

#### Output:
- Data bisa dilihat semua tim (akses terbuka tapi terekam)
- Laporan keuangan, keberangkatan, progres visa

#### Exception:
- Data bisa diubah tapi tidak dihapus (soft-delete)
- Perubahan selalu terekam (audit log)
- Error pada import Excel: tampilkan baris & alasan

---

### Alur Khusus:
#### Keuangan:
- Input bukti pembayaran → sinkron ke status jamaah
- Hanya tim keuangan yang bisa edit nominal

#### Tim Visa:
- Lihat data paspor, update status proses visa
- Upload file visa yang sudah jadi

#### Operator Keberangkatan:
- Buat daftar rombongan, penempatan bus, waktu kumpul
- Print rooming list dan manifest keberangkatan

#### Hotel & Ticketing:
- Lihat nama-nama jamaah per paket
- Bantu alokasi kamar dan kursi

---

## Integrasi Eksternal
- Belum ada (saat ini hanya untuk penggunaan internal)
- Rencana ke depan: integrasi API e-visa atau modul agen (terpisah)

## 4. Phased Roadmap & Milestones

### Phase 1 (MVP)
- Input data jamaah (form & Excel)
- View/edit data
- Log aktivitas per user
- Role-based access (akses penuh, log aktif)
- Export data (PDF, Excel)
- Backup otomatis
- Dashboard ringkas

### Phase 2
- Upload dokumen jamaah
- Relasi keluarga/mahram
- Catatan medis & status lansia
- Laporan: jamaah/paket/pembayaran/keberangkatan

### Phase 3
- Dashboard visualisasi
- Monitor aktivitas user
- Analitik jamaah (usia, domisili, dsb)
- API ekspor data
- Modul manajemen paket
- Offline access (opsional)

## 5. Technical Architecture Overview (Usulan Best Practice)

### Stack/Platform:
- Frontend: React
- Backend: Node.js (Express)
- DB: PostgreSQL
- Storage: MinIO / S3-compatible
- Deployment: dockerized, cloud-ready

### Security & Modularity:
- Semua data di-log (aktivitas, edit, akses)
- Soft-delete dengan histori
- Validasi ketat NIK/paspor
- Tidak ada multi-login enforcement (berbasis kepercayaan)

### Maintainability:
- Struktur modular per modul (jamaah, dokumen, relasi, pembayaran)
- Endpoint RESTful
- Automated testing untuk form, import, validasi
- Backup harian & monitoring error

## 6. Agentic AI Instruction (Prompt)

- Dokumen ini adalah single source of truth bagi semua agent AI atau developer.
- Setiap tugas dimulai dengan plan mode (3 langkah), tunggu validasi user.
- Interview harus mencakup:
  - Masalah bisnis
  - Tujuan & metrik
  - Flow proses bisnis
  - Roadmap & arsitektur
  - Agent harus mampu memahami alur kerja nyata, bukan hanya form permukaan.
- Semua modul wajib mencerminkan proses bisnis: siapa melakukan apa, data apa masuk, hasilnya apa, dan penanganan gagal.
- Terapkan agentic meta pattern: Orchestrator, Specialist, Evaluator.
- Terapkan best practice:
  - Validasi input
  - Audit log
  - Backup otomatis
  - Modular & secure
- Gunakan fallback ke standar industri jika ada ketidakjelasan: OWASP, Google Engineering Guide, Laravel Docs, dsb.

## 7. Development Workflow (WAJIB)

### Alur Development Setiap Fitur:
**PERHATIKAN: Setiap fitur WAJIB melalui tahapan berikut secara berurutan:**

1. **Frontend Development**
   - Buat UI/UX sesuai permintaan user
   - Implementasi form, tabel, modal, navigasi
   - Styling dengan glass morphism design existing
   - Validasi frontend dan user experience

2. **Backend Development** 
   - Implementasi business logic sesuai requirement
   - Setup database schema dan migration
   - Buat API endpoint (RESTful)
   - Implementasi validasi server-side
   - Setup authentication & authorization
   - Error handling dan logging

3. **Testing & Quality Assurance (WAJIB)**
   - **Docker Desktop Testing**: Gunakan Docker untuk virtual environment
   - Unit testing untuk setiap function
   - Integration testing untuk API endpoints
   - Frontend testing (form submission, data display)
   - Performance testing untuk load handling
   - Security testing (input validation, SQL injection, XSS)

### Docker Testing Environment:
- Setup containerized development environment
- Database testing dengan PostgreSQL container
- Backend testing dengan Node.js container  
- Frontend testing dengan Nginx container
- Volume mounting untuk hot reload development

### Testing Checklist:
- [ ] Frontend forms working correctly
- [ ] API endpoints responding properly
- [ ] Database operations (CRUD) working
- [ ] Validation working on both frontend & backend
- [ ] Error handling functioning
- [ ] Security measures implemented
- [ ] Performance within acceptable limits
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

**CRITICAL**: Tidak boleh melanjutkan ke fitur berikutnya sebelum testing selesai dan lulus semua checklist.

---

## 8. Task Output Format
- Ringkasan hasil (fitur, endpoint, validasi)
- Perubahan file/folder
- Prompt/plan yang digunakan
- Self-evaluation kualitas hasil

## 9. Frontend Design System - Glass Morphism Theme

### Core Design Principles
Aplikasi menggunakan **Glass Morphism Design System** yang konsisten di seluruh frontend dengan karakteristik:
- Transparent backgrounds dengan blur effects
- Gradient overlays untuk depth dan dimensi
- Smooth shadows dan border styling
- Animasi dan transisi yang halus
- Warna-warna vibrant dengan gradients

### Color Palette

#### Primary Colors
- **Blue**: `#3b82f6`, `#2563eb` - Primary actions, links
- **Green**: `#10b981`, `#059669` - Success states, positive actions
- **Purple**: `#8b5cf6`, `#7c3aed` - Accent, special features
- **Orange**: `#f59e0b`, `#d97706` - Warnings, highlights
- **Pink**: `#ec4899`, `#db2777` - Notifications, alerts

#### Neutral Colors
- **Dark**: `#0f172a`, `#1e293b` - Backgrounds
- **Gray**: `#334155`, `#475569`, `#64748b` - Borders, subtle elements
- **Light**: `#94a3b8`, `#cbd5e1`, `#e2e8f0` - Text, foregrounds

### Component Styling Standards

#### 1. Background Layers
```css
/* Main background gradient */
background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);

/* Overlay gradients untuk depth */
background: 
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
```

#### 2. Glass Morphism Cards
```css
/* Standard card styling */
background: linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.75));
backdrop-filter: blur(20px);
border-radius: 20px;
border: 1px solid rgba(71, 85, 105, 0.3);
box-shadow: 
    inset 0 1px 0 rgba(71, 85, 105, 0.4),
    0 20px 40px rgba(0, 0, 0, 0.3);
```

#### 3. Interactive Elements
- **Buttons**: Gradient backgrounds dengan hover effects
- **Inputs**: Dark backgrounds dengan focus glow
- **Cards**: Hover transform dan shadow transitions
- **Navigation**: Slide animations dan active states

#### 4. Typography
- **Font**: Inter (300-700 weights)
- **Headers**: 20-32px dengan gradient text effect
- **Body**: 14px dengan color `#e2e8f0`
- **Small**: 12px dengan color `#94a3b8`

#### 5. Spacing System
- **Container padding**: 24px (mobile: 16px)
- **Card padding**: 16-24px
- **Element gaps**: 8, 12, 16, 24px
- **Border radius**: 8px (small), 12px (medium), 20px (large)

### Animation Guidelines

#### 1. Transitions
```css
transition: all 0.3s ease; /* Standard */
transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Smooth */
```

#### 2. Hover Effects
- Transform: `translateY(-2px)` atau `translateX(5px)`
- Shadow: Increase blur dan spread
- Background: Lighten dengan opacity changes

#### 3. Loading States
- Pulse animations untuk badges
- Rotating gradients untuk progress
- Skeleton screens dengan shimmer effect

### Reusable Components

#### 1. Header Component
```html
<div class="header">
    <div class="logo">
        <span class="material-icons">icon_name</span>
        Vauza Tamma
    </div>
    <div class="header-actions">
        <div class="notification-btn">
            <span class="material-icons">notifications</span>
            <span class="notification-badge">3</span>
        </div>
        <div class="user-profile">
            <div class="user-avatar">
                <span class="avatar-initials">A</span>
            </div>
            <div>
                <div class="user-name">Admin</div>
                <div class="user-role">Role</div>
            </div>
        </div>
    </div>
</div>
```

#### 2. Card Component
```html
<div class="card-container">
    <div class="card-header">
        <h3 class="card-title">Title</h3>
        <div class="card-actions"><!-- buttons --></div>
    </div>
    <div class="card-body">
        <!-- content -->
    </div>
</div>
```

#### 3. Button Classes
- `.btn` - Base button
- `.btn-primary` - Blue gradient
- `.btn-success` - Green gradient
- `.btn-secondary` - Gray with border
- `.btn-icon` - Icon-only button

#### 4. Form Elements
- `.form-group` - Form field wrapper
- `.form-label` - Label styling
- `.form-control` - Input/select/textarea styling

### Responsive Breakpoints
- Desktop: > 1200px (full layout)
- Tablet: 768px - 1200px (adjusted spacing)
- Mobile: < 768px (stacked layout)

### Special Effects

#### 1. Floating Particles
Animated background particles untuk visual interest:
```javascript
// Create 5-10 particles dengan random colors
// Float animation 20-30 seconds
// Random positions dan sizes
```

#### 2. Gradient Text
```css
background: linear-gradient(135deg, #3b82f6, #10b981, #8b5cf6);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
```

#### 3. Ripple Effects
Click animations untuk feedback visual

### Implementation Notes

1. **File Structure**:
   ```
   frontend/
   ├── css/
   │   ├── style.css         # Global styles
   │   ├── components.css    # Reusable components
   │   └── [page].css        # Page-specific styles
   ```

2. **Usage**:
   - Selalu import `style.css` di setiap halaman
   - Gunakan class yang sudah ada sebelum membuat baru
   - Maintain consistency dengan existing components

3. **Performance**:
   - Limit blur effects pada mobile
   - Reduce animation complexity untuk device low-end
   - Use CSS containment untuk complex components

4. **Accessibility**:
   - Maintain color contrast ratios
   - Provide focus indicators
   - Support reduced motion preferences

### Future Enhancements
- Dark/Light mode toggle
- Custom color themes
- Animation preferences
- Component library documentation