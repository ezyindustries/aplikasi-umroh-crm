# WhatsApp CRM Application – Requirements & AI Prompt

## IMPORTANT NOTES FOR AI ASSISTANT
- **NEVER restart the server/backend using commands that timeout** - This causes the AI session to disconnect
- When server restart is needed, instruct the user to do it manually
- Avoid using long-running commands like `npm run dev` or `node server.js` directly
- Use background processes or provide clear manual instructions instead

## 1. Executive Summary
Aplikasi WhatsApp CRM sederhana yang fokus pada komunikasi dengan customer melalui WhatsApp menggunakan WAHA (WhatsApp HTTP API). Aplikasi hanya memiliki 2 halaman utama: CRM Dashboard dan Conversations.

## 2. Core Features
- **CRM Dashboard** (crm-main.html): Interface utama untuk mengelola percakapan WhatsApp
- **Conversations Page** (conversations-beautiful.html): Halaman khusus untuk chat dengan customer
- **Database**: SQLite untuk penyimpanan sederhana dan portable
- **WhatsApp Integration**: WAHA official API untuk koneksi WhatsApp

## 3. Technical Stack
- **Frontend**: HTML/CSS/JavaScript (No frameworks)
- **Backend**: Node.js dengan Express (Minimal setup)
- **Database**: SQLite
- **WhatsApp**: WAHA Official API
- **No additional features**: Hanya fokus pada WhatsApp CRM

## 4. Business Process Flow

### Single Actor: Admin/Operator
- Mengelola percakapan WhatsApp melalui CRM dashboard
- Membalas pesan customer
- Melihat riwayat percakapan

### Simple Flow:
1. **Input**: Pesan masuk dari WhatsApp customer
2. **Process**: Admin membaca dan membalas melalui web interface
3. **Output**: Pesan terkirim ke customer
4. **Storage**: Semua percakapan tersimpan di SQLite

## 5. Database Schema (SQLite)

### Tables:
1. **contacts**: Menyimpan data kontak WhatsApp
2. **messages**: Menyimpan semua pesan
3. **conversations**: Menyimpan percakapan/chat
4. **sessions**: Menyimpan session WhatsApp

## 6. Technical Architecture (Simplified)

### Stack:
- Frontend: Plain HTML/CSS/JavaScript
- Backend: Node.js (Express) - Minimal
- Database: SQLite
- WhatsApp: WAHA Official API

### Key Files:
- `frontend/crm-main.html` - CRM Dashboard
- `frontend/conversations-beautiful.html` - Chat Interface
- `backend/whatsapp/server.js` - WhatsApp backend
- `backend/whatsapp/data/whatsapp-crm.db` - SQLite database

## 7. Important Notes

- **FOKUS**: Hanya WhatsApp CRM, tidak ada fitur lain
- **DATABASE**: SQLite only, tidak ada PostgreSQL
- **FRONTEND**: Hanya 2 file HTML yang disebutkan
- **BACKEND**: Minimal, 
- **NO FEATURES**: Tidak ada manajemen jamaah, paket, pembayaran, dll

## 8. WAHA Integration

- Use official WAHA API endpoints
- Session management with QR code
- Real-time message sync
- Webhook handling for incoming messages

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
- Component library documentation1