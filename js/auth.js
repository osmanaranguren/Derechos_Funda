/**
 * GESTOR DE AUTENTICACIÓN Y SEGURIDAD (OTP / PIN DE 4 DÍGITOS)
 * Restringe el acceso al panel de Fichas y Calificaciones exclusivamente a
 * Coordinadores y Administradores.
 */

class AuthManager {
  constructor() {
    this.sessionKey = 'sena_auth_session';
    this.customPinKey = 'sena_custom_pin';
    this.targetViewAfterAuth = 'records';
    
    // PINs predeterminados autorizados
    this.defaultPins = {
      '2026': { role: 'Coordinador Académico', icon: '👔' },
      '1234': { role: 'Coordinador de Formación', icon: '📋' },
      '7788': { role: 'Administrador General', icon: '👑' },
      '9999': { role: 'Administrador de Sistema', icon: '⚡' }
    };
  }

  isAuthenticated() {
    try {
      const session = JSON.parse(sessionStorage.getItem(this.sessionKey));
      if (!session || !session.authenticated) return false;
      // Expiración de sesión (por ejemplo, 4 horas)
      if (Date.now() - session.timestamp > 4 * 60 * 60 * 1000) {
        this.logout(false);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  getCurrentUser() {
    try {
      const session = JSON.parse(sessionStorage.getItem(this.sessionKey));
      return session || null;
    } catch (e) {
      return null;
    }
  }

  openAuthModal(targetView = 'records') {
    this.targetViewAfterAuth = targetView;
    const modal = document.getElementById('otp-auth-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Resetear inputs de OTP
    this.resetOtpInputs();
    this.clearError();

    // Enfocar primer input después de abrir
    setTimeout(() => {
      const firstInput = document.getElementById('otp-digit-1');
      if (firstInput) firstInput.focus();
    }, 100);

    if (window.soundEngine) window.soundEngine.playClick();
  }

  closeAuthModal() {
    const modal = document.getElementById('otp-auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.resetOtpInputs();
  }

  resetOtpInputs() {
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (input) {
        input.value = '';
        input.classList.remove('border-red-500', 'border-emerald-500', 'ring-2', 'ring-red-500', 'ring-red-500/30', 'bg-emerald-50', 'dark:bg-emerald-950/40');
      }
    }
  }

  appendDigit(digit) {
    this.clearError();
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (input && !input.value) {
        input.value = String(digit);
        input.classList.remove('border-red-500', 'ring-2', 'ring-red-500/30');
        if (window.soundEngine) window.soundEngine.playClick();
        if (i === 4) {
          this.verifyOtp();
        } else {
          const next = document.getElementById(`otp-digit-${i + 1}`);
          if (next) next.focus();
        }
        break;
      }
    }
  }

  deleteDigit() {
    this.clearError();
    for (let i = 4; i >= 1; i--) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (input && input.value) {
        input.value = '';
        input.classList.remove('border-red-500', 'ring-2', 'ring-red-500/30');
        input.focus();
        if (window.soundEngine) window.soundEngine.playClick();
        break;
      }
    }
  }

  getEnteredPin() {
    let pin = '';
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      pin += (input ? input.value : '');
    }
    return pin.trim();
  }

  verifyOtp() {
    const pin = this.getEnteredPin();
    const errorEl = document.getElementById('otp-error-msg');
    const container = document.getElementById('otp-inputs-container');

    if (pin.length < 4) {
      this.showError('Por favor ingresa los 4 dígitos del código PIN.');
      this.shakeInputs();
      return;
    }

    let authInfo = this.defaultPins[pin];

    // Verificar si hay un PIN personalizado configurado
    const customPin = localStorage.getItem(this.customPinKey);
    if (!authInfo && customPin && pin === customPin) {
      authInfo = { role: 'Administrador Personalizado', icon: '🛡️' };
    }

    if (authInfo) {
      // Autenticación Exitosa
      const sessionData = {
        authenticated: true,
        role: authInfo.role,
        icon: authInfo.icon,
        timestamp: Date.now()
      };
      sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

      // Indicadores visuales de éxito
      for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`otp-digit-${i}`);
        if (input) {
          input.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950/40');
        }
      }

      if (errorEl) {
        errorEl.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5 animate-fadeIn">✓ Acceso concedido: ${authInfo.role}</span>`;
        errorEl.classList.remove('hidden');
      }

      if (window.soundEngine) window.soundEngine.playCorrect();

      setTimeout(() => {
        this.closeAuthModal();
        this.updateAuthBadge();
        if (window.app) {
          window.app.forceNavigateTo(this.targetViewAfterAuth);
        }
      }, 400);

    } else {
      // Código Incorrecto
      this.showError('Código PIN inválido. Acceso exclusivo para Coordinadores y Administrador.');
      this.shakeInputs();
      if (window.soundEngine) window.soundEngine.playWrong();
      
      // Resaltar en rojo
      for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`otp-digit-${i}`);
        if (input) {
          input.classList.add('border-red-500', 'ring-2', 'ring-red-500/30');
        }
      }
    }
  }

  showError(msg) {
    const errorEl = document.getElementById('otp-error-msg');
    if (errorEl) {
      errorEl.innerHTML = `<span class="text-red-500 font-bold flex items-center justify-center gap-1">⚠️ ${msg}</span>`;
      errorEl.classList.remove('hidden');
    }
  }

  clearError() {
    const errorEl = document.getElementById('otp-error-msg');
    if (errorEl) {
      errorEl.innerHTML = '';
      errorEl.classList.add('hidden');
    }
  }

  shakeInputs() {
    const container = document.getElementById('otp-inputs-container');
    if (container) {
      container.classList.remove('animate-shake');
      void container.offsetWidth; // Forzar reflujo
      container.classList.add('animate-shake');
    }
  }

  logout(redirect = true) {
    sessionStorage.removeItem(this.sessionKey);
    this.updateAuthBadge();
    if (redirect && window.app) {
      window.app.navigateTo('home');
    }
    if (window.soundEngine) window.soundEngine.playClick();
  }

  updateAuthBadge() {
    const badge = document.getElementById('records-auth-status-badge');
    const user = this.getCurrentUser();
    if (badge) {
      if (user && user.authenticated) {
        badge.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <span>${user.icon || '🛡️'}</span>
            <span>${user.role}</span>
          </span>
          <button 
            onclick="window.authManager.logout()"
            class="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition flex items-center gap-1 border border-red-500/20"
            title="Cerrar sesión y bloquear panel"
          >
            <span>🔒</span> Bloquear
          </button>
        `;
        badge.classList.remove('hidden');
      } else {
        badge.innerHTML = '';
        badge.classList.add('hidden');
      }
    }
  }

  initOtpInputHandlers() {
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(`otp-digit-${i}`);
      if (!input) continue;

      input.addEventListener('input', (e) => {
        const val = e.target.value;
        // Solo aceptar dígitos
        e.target.value = val.replace(/\D/g, '').slice(-1);

        if (e.target.value) {
          e.target.classList.remove('border-red-500', 'ring-2', 'ring-red-500/30');
          const next = document.getElementById(`otp-digit-${i + 1}`);
          if (next) {
            next.focus();
          } else {
            // Último dígito completado -> verificar automáticamente
            this.verifyOtp();
          }
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value) {
          const prev = document.getElementById(`otp-digit-${i - 1}`);
          if (prev) {
            prev.focus();
          }
        } else if (e.key === 'Enter') {
          this.verifyOtp();
        } else if (e.key === 'Escape') {
          this.closeAuthModal();
        }
      });

      // Manejar pegado de 4 dígitos
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        const digits = pasted.replace(/\D/g, '').slice(0, 4);
        if (digits) {
          for (let d = 0; d < digits.length; d++) {
            const digitInput = document.getElementById(`otp-digit-${d + 1}`);
            if (digitInput) digitInput.value = digits[d];
          }
          if (digits.length === 4) {
            this.verifyOtp();
          } else {
            const nextFocus = document.getElementById(`otp-digit-${digits.length + 1}`);
            if (nextFocus) nextFocus.focus();
          }
        }
      });
    }
  }
}

window.authManager = new AuthManager();
document.addEventListener('DOMContentLoaded', () => {
  window.authManager.initOtpInputHandlers();
  window.authManager.updateAuthBadge();
});
