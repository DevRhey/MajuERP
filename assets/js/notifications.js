// Sistema de Notificações Toast
// Substitui alerts nativos do browser por notificações modernas

class ToastNotification {
  constructor() {
    this.container = null;
    this.initContainer();
  }

  /**
   * Inicializa container de toasts
   */
  initContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container position-fixed top-0 end-0 p-3';
      this.container.style.zIndex = '9999';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Mostra notificação toast
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo: success, error, warning, info
   * @param {number} duration - Duração em ms (0 = permanente)
   */
  show(message, type = 'info', duration = 4000) {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remover se duration > 0
    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }

    return toast;
  }

  /**
   * Cria elemento toast
   */
  createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${this.getBootstrapClass(type)} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icon} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    // Event listener para fechar
    toast.querySelector('.btn-close').addEventListener('click', () => {
      this.hide(toast);
    });

    return toast;
  }

  /**
   * Remove toast
   */
  hide(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Converte tipo para classe Bootstrap
   */
  getBootstrapClass(type) {
    const map = {
      'success': 'success',
      'error': 'danger',
      'warning': 'warning',
      'info': 'info'
    };
    return map[type] || 'info';
  }

  /**
   * Retorna ícone apropriado
   */
  getIcon(type) {
    const icons = {
      'success': 'bi-check-circle-fill',
      'error': 'bi-exclamation-triangle-fill',
      'warning': 'bi-exclamation-circle-fill',
      'info': 'bi-info-circle-fill'
    };
    return icons[type] || icons.info;
  }

  /**
   * Atalhos para tipos
   */
  success(message, duration = 4000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 5000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 4000) {
    return this.show(message, 'info', duration);
  }

  /**
   * Toast com loading
   */
  loading(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-primary border-0 show';
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <span class="spinner-border spinner-border-sm me-2"></span>
          ${message}
        </div>
      </div>
    `;

    this.container.appendChild(toast);
    return toast;
  }

  /**
   * Remove toast de loading e mostra resultado
   */
  resolveLoading(loadingToast, message, type = 'success', duration = 4000) {
    this.hide(loadingToast);
    setTimeout(() => this.show(message, type, duration), 100);
  }
}

/**
 * Modal de Confirmação Customizado
 */
class ConfirmDialog {
  /**
   * Mostra diálogo de confirmação
   * @param {string} title - Título
   * @param {string} message - Mensagem
   * @param {Object} options - Opções
   * @returns {Promise<boolean>} True se confirmado
   */
  static show(title, message, options = {}) {
    return new Promise((resolve) => {
      const {
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        type = 'warning', // warning, danger, info
        html = false
      } = options;

      const modalId = 'confirm-dialog-' + Date.now();
      
      const typeClass = type === 'danger' ? 'btn-danger' : 'btn-warning';
      const icon = type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-question-circle-fill';

      const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="bi ${icon} me-2"></i>${title}
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                ${html ? message : `<p>${message}</p>`}
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                <button type="button" class="btn ${typeClass}" id="confirm-btn">${confirmText}</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      const modalElement = document.getElementById(modalId);
      const modal = new bootstrap.Modal(modalElement);

      modalElement.querySelector('#confirm-btn').addEventListener('click', () => {
        modal.hide();
        resolve(true);
      });

      modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
        resolve(false);
      });

      modal.show();
    });
  }
}

// Instâncias globais
const toast = new ToastNotification();

// Export
window.ToastNotification = ToastNotification;
window.ConfirmDialog = ConfirmDialog;
window.toast = toast;
