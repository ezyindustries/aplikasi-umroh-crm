// Common bug fixes and error handlers for the Umroh Management System

export const bugFixes = {
  
  // Fix missing navigation handlers
  fixNavigationHandlers: () => {
    const navLinks = document.querySelectorAll('a[href]');
    navLinks.forEach(link => {
      if (!link.onclick && link.href.includes(window.location.origin)) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const href = link.getAttribute('href');
          if (href && href !== '#') {
            window.history.pushState({}, '', href);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        });
      }
    });
  },

  // Fix missing form validation
  fixFormValidation: () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const requiredInputs = form.querySelectorAll('input[required], select[required], textarea[required]');
      
      requiredInputs.forEach(input => {
        if (!input.oninvalid) {
          input.addEventListener('invalid', (e) => {
            e.target.style.borderColor = '#f44336';
            const helpText = e.target.parentElement.querySelector('.MuiFormHelperText-root');
            if (helpText) {
              helpText.textContent = 'Field ini wajib diisi';
              helpText.style.color = '#f44336';
            }
          });
          
          input.addEventListener('input', (e) => {
            if (e.target.validity.valid) {
              e.target.style.borderColor = '';
              const helpText = e.target.parentElement.querySelector('.MuiFormHelperText-root');
              if (helpText && helpText.textContent === 'Field ini wajib diisi') {
                helpText.textContent = '';
                helpText.style.color = '';
              }
            }
          });
        }
      });
    });
  },

  // Fix missing button click handlers
  fixButtonHandlers: () => {
    const buttons = document.querySelectorAll('button:not([onclick]):not([disabled])');
    buttons.forEach(button => {
      const buttonText = button.textContent.trim().toLowerCase();
      
      // Add default handlers for common buttons
      if (buttonText.includes('refresh') || buttonText.includes('reload')) {
        button.addEventListener('click', () => {
          window.location.reload();
        });
      }
      
      if (buttonText.includes('close') || buttonText.includes('tutup')) {
        button.addEventListener('click', () => {
          const dialog = button.closest('[role="dialog"]');
          if (dialog) {
            dialog.style.display = 'none';
          }
        });
      }
      
      if (buttonText.includes('cancel') || buttonText.includes('batal')) {
        button.addEventListener('click', () => {
          window.history.back();
        });
      }
    });
  },

  // Fix API error handling
  fixAPIErrorHandling: () => {
    // Override fetch to add global error handling
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          // Show user-friendly error messages
          const errorMessages = {
            400: 'Data yang dikirim tidak valid',
            401: 'Anda harus login terlebih dahulu',
            403: 'Anda tidak memiliki akses untuk operasi ini',
            404: 'Data yang dicari tidak ditemukan',
            500: 'Terjadi kesalahan pada server',
            502: 'Server sedang tidak dapat diakses',
            503: 'Server sedang dalam maintenance'
          };
          
          const message = errorMessages[response.status] || `Error ${response.status}: ${response.statusText}`;
          
          // Show toast notification if available
          if (window.toast && typeof window.toast.error === 'function') {
            window.toast.error(message);
          } else {
            console.error('API Error:', message);
            alert(message);
          }
        }
        
        return response;
      } catch (error) {
        const message = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        
        if (window.toast && typeof window.toast.error === 'function') {
          window.toast.error(message);
        } else {
          console.error('Network Error:', error);
          alert(message);
        }
        
        throw error;
      }
    };
  },

  // Fix missing loading states
  fixLoadingStates: () => {
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        if (!button.disabled) {
          button.disabled = true;
          const originalText = button.textContent;
          button.textContent = 'Loading...';
          
          // Re-enable after 5 seconds if still disabled
          setTimeout(() => {
            if (button.disabled) {
              button.disabled = false;
              button.textContent = originalText;
            }
          }, 5000);
        }
      });
    });
  },

  // Fix responsive design issues
  fixResponsiveDesign: () => {
    // Add mobile-friendly table scrolling
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.parentElement.classList.contains('table-responsive')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        wrapper.style.overflowX = 'auto';
        wrapper.style.maxWidth = '100%';
        
        table.parentElement.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    // Fix mobile navigation
    const sidebar = document.querySelector('.MuiDrawer-root');
    if (sidebar && window.innerWidth <= 768) {
      sidebar.style.transform = 'translateX(-100%)';
      
      const menuButton = document.querySelector('[aria-label="open drawer"]');
      if (menuButton) {
        menuButton.addEventListener('click', () => {
          const isOpen = sidebar.style.transform === 'translateX(0px)';
          sidebar.style.transform = isOpen ? 'translateX(-100%)' : 'translateX(0px)';
        });
      }
    }
  },

  // Fix accessibility issues
  fixAccessibility: () => {
    // Add missing ARIA labels
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.textContent.trim()) {
        const icon = button.querySelector('svg, .MuiSvgIcon-root');
        if (icon) {
          button.setAttribute('aria-label', 'Button');
        }
      }
    });

    // Add missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const label = input.parentElement.querySelector('label');
      if (label && !input.id) {
        const id = 'input-' + Math.random().toString(36).substr(2, 9);
        input.id = id;
        label.setAttribute('for', id);
      }
    });

    // Add focus management for modals
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(dialog => {
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    });
  },

  // Apply all fixes
  applyAllFixes: () => {
    console.log('🔧 Applying bug fixes...');
    
    bugFixes.fixNavigationHandlers();
    bugFixes.fixFormValidation();
    bugFixes.fixButtonHandlers();
    bugFixes.fixAPIErrorHandling();
    bugFixes.fixLoadingStates();
    bugFixes.fixResponsiveDesign();
    bugFixes.fixAccessibility();
    
    console.log('✅ Bug fixes applied successfully!');
  }
};

// Auto-apply fixes when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bugFixes.applyAllFixes);
} else {
  bugFixes.applyAllFixes();
}

// Export for manual use
window.bugFixes = bugFixes;

export default bugFixes;