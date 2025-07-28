# Glass Morphism Style Guide - Vauza Tamma

## Overview
This style guide documents the Glass Morphism design system implemented across all Vauza Tamma frontend applications. It ensures consistency and provides guidelines for developers to maintain the visual language.

## Quick Start

### 1. Required Files
```html
<!-- In every HTML page -->
<link rel="stylesheet" href="css/style.css">        <!-- Global styles -->
<link rel="stylesheet" href="css/components.css">   <!-- Component library -->
<link rel="stylesheet" href="css/[page].css">       <!-- Page-specific (optional) -->
```

### 2. Basic Page Structure
```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - Vauza Tamma</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <!-- Content -->
</body>
</html>
```

## Component Usage Examples

### 1. Glass Container
```html
<div class="glass-container">
    <h2>Container Title</h2>
    <p>Content goes here with beautiful glass morphism effect</p>
</div>
```

### 2. Stat Cards
```html
<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon blue">
            <span class="material-icons">people</span>
        </div>
        <div class="stat-content">
            <div class="stat-value">1,234</div>
            <div class="stat-label">Total Jamaah</div>
        </div>
    </div>
</div>
```

### 3. Enhanced Buttons
```html
<!-- Primary gradient button -->
<button class="btn btn-primary">
    <span class="material-icons">add</span>
    Primary Action
</button>

<!-- Purple gradient -->
<button class="btn btn-gradient-purple">
    Special Action
</button>

<!-- Outline button -->
<button class="btn btn-outline">
    Secondary Action
</button>
```

### 4. Form Elements
```html
<!-- Input with icon -->
<div class="input-group">
    <span class="input-group-icon material-icons">search</span>
    <input type="text" class="input-enhanced" placeholder="Search...">
</div>

<!-- Floating label -->
<div class="form-floating">
    <input type="text" class="form-control" placeholder=" " id="name">
    <label for="name">Full Name</label>
</div>
```

### 5. Feature Cards
```html
<div class="feature-card">
    <div class="feature-card-icon gradient-blue">
        <span class="material-icons">dashboard</span>
    </div>
    <h3 class="feature-card-title">Dashboard</h3>
    <p class="feature-card-description">
        Monitor your umrah operations in real-time
    </p>
</div>
```

### 6. Navigation Tabs
```html
<div class="tab-nav">
    <div class="tab-nav-item active">Overview</div>
    <div class="tab-nav-item">Details</div>
    <div class="tab-nav-item">History</div>
</div>
```

### 7. Badges and Status
```html
<!-- Gradient badges -->
<span class="badge-gradient-blue">New</span>
<span class="badge-gradient-purple">Premium</span>

<!-- Status indicators -->
<span class="status-indicator status-online">Online</span>
<span class="status-indicator status-busy">Busy</span>
```

### 8. Loading States
```html
<!-- Spinner -->
<div class="loading-spinner"></div>

<!-- Progress bar -->
<div class="progress-bar-container">
    <div class="progress-bar" style="width: 60%"></div>
</div>
```

## Color Usage Guidelines

### Primary Actions
- Use **Blue** (#3b82f6) for primary CTAs and important actions
- Use **Green** (#10b981) for success states and positive feedback

### Special Features
- Use **Purple** (#8b5cf6) for premium or special features
- Use **Orange** (#f59e0b) for warnings or important notices
- Use **Pink** (#ec4899) for notifications and alerts

### Text Colors
- Headlines: #e2e8f0 or gradient text
- Body text: #e2e8f0
- Muted text: #94a3b8
- Subtle text: #64748b

## Animation Guidelines

### Standard Transitions
```css
/* Use for most interactions */
transition: all 0.3s ease;

/* Use for smooth complex animations */
transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Hover States
1. **Lift Effect**: Add `hover-lift` class
2. **Scale Effect**: Add `hover-scale` class
3. **Glow Effect**: Add `glow-effect` class

### Special Effects
```html
<!-- Gradient text -->
<h1 class="text-gradient-multicolor">Amazing Title</h1>

<!-- Gradient border -->
<div class="gradient-border">
    Content with animated gradient border
</div>

<!-- Shadow glow -->
<div class="glass-container shadow-glow-blue">
    Glowing container
</div>
```

## Responsive Design

### Breakpoint Classes
```css
/* Desktop: > 1200px */
.desktop-only { display: block; }

/* Tablet: 768px - 1200px */
@media (max-width: 1200px) {
    .desktop-only { display: none; }
}

/* Mobile: < 768px */
@media (max-width: 768px) {
    .mobile-hidden { display: none; }
}
```

### Container Padding
- Desktop: 24px
- Tablet: 20px
- Mobile: 16px

## Best Practices

### 1. Performance
- Limit blur effects on mobile devices
- Use `will-change` for animated elements
- Lazy load heavy components

### 2. Accessibility
- Maintain WCAG AA contrast ratios
- Always include focus states
- Support `prefers-reduced-motion`

### 3. Consistency
- Always use predefined classes before creating new ones
- Follow the spacing system (8, 12, 16, 24, 32px)
- Use the standard border radius values

### 4. Dark Mode (Future)
```css
/* Prepare for dark mode with CSS variables */
:root {
    --bg-primary: rgba(30, 41, 59, 0.85);
    --text-primary: #e2e8f0;
}
```

## Component Combinations

### 1. Dashboard Card
```html
<div class="glass-container">
    <div class="table-header">
        <h3 class="table-title">Recent Activity</h3>
        <div class="table-actions">
            <button class="btn btn-primary">View All</button>
        </div>
    </div>
    <div class="table-wrapper">
        <!-- Table content -->
    </div>
</div>
```

### 2. Modal with Form
```html
<div class="modal-enhanced">
    <div class="modal-enhanced-content">
        <div class="modal-header">
            <h3 class="modal-title">Add New Jamaah</h3>
            <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
            <!-- Form elements -->
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary">Cancel</button>
            <button class="btn btn-primary">Save</button>
        </div>
    </div>
</div>
```

### 3. Stats Dashboard
```html
<div class="stats-grid">
    <div class="stat-card-enhanced">
        <div class="stat-icon gradient-blue">
            <span class="material-icons">trending_up</span>
        </div>
        <div class="stat-content">
            <div class="stat-value text-gradient-blue-green">+25%</div>
            <div class="stat-label">Growth Rate</div>
        </div>
    </div>
</div>
```

## File Organization

```
frontend/
├── css/
│   ├── style.css         # Core styles (required)
│   ├── components.css    # Component library (required)
│   ├── animations.css    # Animation utilities (optional)
│   └── [page].css        # Page-specific overrides
├── js/
│   ├── app.js           # Core functionality
│   └── components.js    # Component behaviors
└── assets/
    ├── images/
    └── icons/
```

## Troubleshooting

### Common Issues

1. **Blur not working**: Check browser support, add `-webkit-backdrop-filter`
2. **Gradients look flat**: Ensure proper layering with z-index
3. **Performance issues**: Reduce blur radius on mobile, disable animations

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support (may need prefixes)
- Safari: Partial (some backdrop-filter issues)
- Mobile: Optimized with fallbacks

## Future Enhancements

1. **Theme System**: CSS variables for easy customization
2. **Dark Mode**: Automatic dark/light switching
3. **Motion Preferences**: Respect user settings
4. **Component Playground**: Interactive documentation

## Resources

- [Design System in CLAUDE.md](./CLAUDE.md#9-frontend-design-system---glass-morphism-theme)
- [Component Library](./frontend/css/components.css)
- [Global Styles](./frontend/css/style.css)
- [Live Examples](./frontend/conversations-beautiful.html)