# UI Testing Checklist - Aplikasi Manajemen Umroh

## Dashboard Testing ✅

### Header Actions
- [ ] "Tambah Jamaah" button - should navigate to /jamaah/new
- [ ] "Export" button - should open export dialog
- [ ] Refresh button (top right menu) - should refresh dashboard data
- [ ] Profile menu dropdown - should show profile options
- [ ] Logout button - should logout user

### Tab Navigation
- [ ] "Overview" tab - should show overview content
- [ ] "Analytics" tab - should show analytics content

### Statistics Cards
- [ ] Total Jamaah card - should show hover effect
- [ ] Terdaftar Baru card - should show trend indicator
- [ ] Konfirmasi card - should show data
- [ ] Berangkat card - should show data

### Charts & Interactions
- [ ] Area chart - should be interactive with hover tooltips
- [ ] Pie charts - should show legends and tooltips
- [ ] Chart filters - should update data when changed

## Navigation Testing ✅

### Sidebar Menu
- [ ] Dashboard link - should navigate to /dashboard
- [ ] Data Jamaah submenu:
  - [ ] Daftar Jamaah - should navigate to /jamaah
  - [ ] Tambah Jamaah - should navigate to /jamaah/new
- [ ] Paket Umroh - should navigate to /packages  
- [ ] Pembayaran - should navigate to /payments
- [ ] Dokumen - should navigate to /documents
- [ ] Laporan - should navigate to /reports
- [ ] Manajemen Grup - should navigate to /groups
- [ ] Backup System - should navigate to /backup (admin only)
- [ ] Manajemen User - should navigate to /users (admin only)

### Breadcrumbs
- [ ] Home breadcrumb - should navigate to dashboard
- [ ] Current page breadcrumb - should be highlighted
- [ ] Intermediate breadcrumbs - should navigate to parent pages

### Mobile Navigation
- [ ] Hamburger menu - should toggle sidebar on mobile
- [ ] Mobile drawer - should close after navigation
- [ ] Responsive layout - should adapt to screen size

## Data Table Testing ✅

### Jamaah List Page (/jamaah)
- [ ] Search functionality - should filter results
- [ ] Column sorting - should sort data ascending/descending
- [ ] Advanced filters - should show/hide filter panel
- [ ] Pagination - should navigate between pages
- [ ] Items per page - should change page size

### Table Actions
- [ ] "Lihat Detail" - should navigate to jamaah detail
- [ ] "Edit Data" - should navigate to edit form
- [ ] "Kelola Pembayaran" - should navigate to payments
- [ ] "Hapus" - should show confirmation dialog

### Bulk Operations
- [ ] Select all checkbox - should select all items
- [ ] Individual row selection - should select single item
- [ ] Bulk delete button - should delete selected items
- [ ] "Batal Pilih" - should clear selection

### Header Actions
- [ ] "Import Excel" - should open import dialog
- [ ] "Export Data" - should open export dialog  
- [ ] "Refresh" - should reload table data
- [ ] "Tambah Jamaah" - should navigate to form

### Floating Action Button
- [ ] FAB (+) button - should navigate to new jamaah form

## Forms Testing ✅

### Jamaah Form (/jamaah/new or /jamaah/:id/edit)

#### Step 1: Data Pribadi
- [ ] Nama Lengkap field - should validate required
- [ ] Jenis Kelamin dropdown - should show options
- [ ] NIK field - should validate 16 digits and uniqueness
- [ ] Telepon field - should validate phone format
- [ ] Tempat Lahir field - should validate required
- [ ] Tanggal Lahir picker - should open date picker
- [ ] Alamat field - should accept multiline text

#### Step 2: Data Paspor  
- [ ] Nomor Paspor field - should validate format and uniqueness
- [ ] Tempat Terbit field - should accept text
- [ ] Tanggal Terbit picker - should validate required
- [ ] Tanggal Kadaluarsa picker - should validate and warn if < 6 months
- [ ] Passport validity alert - should show appropriate message

#### Step 3: Informasi Tambahan
- [ ] Email field - should validate email format
- [ ] Paket Umroh dropdown - should load packages from API
- [ ] Kontak Darurat fields - should accept contact info
- [ ] Kondisi Medis field - should accept multiline text

#### Step 4: Review & Submit
- [ ] Review cards - should show entered data
- [ ] Progress bar - should show completion percentage
- [ ] Submit button - should save data and show success message

#### Navigation Controls
- [ ] "Kembali" button - should go to previous step
- [ ] "Lanjut" button - should go to next step (if valid)
- [ ] "Batal" button - should navigate back to list
- [ ] Step validation - should prevent advance if required fields empty

## API Connection Testing ✅

### Authentication
- [ ] Login API - should authenticate user
- [ ] Profile API - should return user data  
- [ ] Logout API - should clear session

### Jamaah APIs
- [ ] GET /jamaah - should return jamaah list
- [ ] GET /jamaah/:id - should return jamaah detail
- [ ] POST /jamaah - should create new jamaah
- [ ] PUT /jamaah/:id - should update jamaah
- [ ] DELETE /jamaah/:id - should delete jamaah

### Other APIs  
- [ ] GET /packages - should return package list
- [ ] GET /reports/dashboard - should return dashboard data
- [ ] GET /payments - should return payment list
- [ ] GET /users - should return user list (admin only)

## Error Handling Testing ✅

### Network Errors
- [ ] API timeout - should show error toast
- [ ] Network failure - should show retry option
- [ ] 401 Unauthorized - should redirect to login
- [ ] 403 Forbidden - should show access denied message
- [ ] 404 Not Found - should show not found message
- [ ] 500 Server Error - should show server error message

### Form Validation Errors
- [ ] Required field empty - should show validation message
- [ ] Invalid format - should show format error
- [ ] Duplicate data - should show uniqueness error
- [ ] File upload errors - should show upload error

## Responsive Design Testing ✅

### Mobile (375px)
- [ ] Sidebar should collapse to drawer
- [ ] Tables should scroll horizontally
- [ ] Form steps should stack vertically
- [ ] Cards should use full width

### Tablet (768px)
- [ ] Sidebar should remain visible
- [ ] Grid layouts should adjust columns
- [ ] Forms should use appropriate widths

### Desktop (1024px+)
- [ ] Full layout should be visible
- [ ] All features should be accessible
- [ ] Optimal spacing and sizing

## Performance Testing ✅

### Loading States
- [ ] Dashboard skeleton loading - should show while fetching
- [ ] Table skeleton loading - should show while loading data
- [ ] Form loading states - should show during submission
- [ ] Button loading states - should show during actions

### Animations
- [ ] Page transitions - should be smooth
- [ ] Card hover effects - should work
- [ ] Button hover effects - should respond
- [ ] Menu animations - should be fluid

### Data Loading
- [ ] Large dataset pagination - should handle efficiently
- [ ] Search results - should filter quickly
- [ ] Real-time updates - should update without refresh

## Accessibility Testing ✅

### Keyboard Navigation
- [ ] Tab order should be logical
- [ ] All interactive elements should be reachable
- [ ] Enter/Space should activate buttons
- [ ] Escape should close dialogs

### Screen Reader Support
- [ ] ARIA labels should be present
- [ ] Form labels should be associated
- [ ] Error messages should be announced
- [ ] Loading states should be announced

## Browser Compatibility ✅

### Chrome
- [ ] All features work
- [ ] Performance is good
- [ ] Animations are smooth

### Firefox  
- [ ] All features work
- [ ] Layout is correct
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] CSS compatibility
- [ ] Date pickers work

### Edge
- [ ] All features work
- [ ] Modern features supported
- [ ] No compatibility issues

---

## Test Results Summary

**Total Tests:** ___
**Passed:** ___  
**Failed:** ___
**Skipped:** ___

**Critical Issues Found:**
- [ ] Issue 1: ___
- [ ] Issue 2: ___
- [ ] Issue 3: ___

**Minor Issues Found:**
- [ ] Issue 1: ___
- [ ] Issue 2: ___

**Recommendations:**
1. ___
2. ___
3. ___

**Testing Completed By:** ___
**Date:** ___
**Environment:** Development/Staging/Production