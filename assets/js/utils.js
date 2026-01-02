// Utility Functions

// LocalStorage Operations
const Storage = {
  save: (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    // Disparar evento personalizado para notificar mudanças
    window.dispatchEvent(new CustomEvent('storageUpdate', { 
      detail: { key, data } 
    }));
  },

  get: (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  remove: (key) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  },

  resetAll: () => {
    // Limpa todo o localStorage
    localStorage.clear();

    // Inicializa com dados padrão
    const defaultData = {
      clientes: [],
      itens: [],
      eventos: [],
      orcamentos: [],
      financeiroTransacoes: [],
      formasPagamento: [
        { id: "pix", nome: "PIX" },
        { id: "debito", nome: "Débito" },
        { id: "credito", nome: "Crédito" },
        { id: "dinheiro", nome: "Dinheiro" },
      ],
    };

    // Salva os dados padrão
    Object.entries(defaultData).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    return defaultData;
  },
};

// Form Validation
const Validation = {
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidCPF: (cpf) => {
    cpf = cpf.replace(/[^\d]/g, "");
    if (cpf.length !== 11) return false;

    // CPF validation algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rest = 11 - (sum % 11);
    let digit1 = rest > 9 ? 0 : rest;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rest = 11 - (sum % 11);
    let digit2 = rest > 9 ? 0 : rest;

    return (
      digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10))
    );
  },

  isValidPhone: (phone) => {
    // Aceita vários formatos: (99) 99999-9999, (99) 9999-9999
    const re = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
    return re.test(phone);
  },
};

// Date Formatting
const DateUtils = {
  formatDate: (date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  },

  formatDateTime: (date) => {
    return new Date(date).toLocaleString("pt-BR");
  },

  isDateValid: (date) => {
    return !isNaN(new Date(date).getTime());
  },

  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
};

// UI Helpers
const UI = {
  showAlert: (message, type = "success") => {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = "9999";
    alertDiv.style.minWidth = "300px";
    alertDiv.style.maxWidth = "600px";
    alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.insertBefore(alertDiv, document.body.firstChild);

    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  },

  showModal: (title, content, large = false) => {
    // Limpar modal/backdrop anteriores para evitar sobreposição
    const existingModal = document.getElementById("dynamicModal");
    if (existingModal) {
      existingModal.remove();
    }
    document.querySelectorAll(".modal-backdrop").forEach((bd) => bd.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");

    const modalSize = large ? 'modal-lg' : '';
    const modalHtml = `
            <div class="modal fade" id="dynamicModal" tabindex="-1">
                <div class="modal-dialog ${modalSize}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = new bootstrap.Modal(document.getElementById("dynamicModal"));
    modal.show();

    document
      .getElementById("dynamicModal")
      .addEventListener("hidden.bs.modal", function () {
        this.remove();
      });
  },
};

// Debounce utility para otimizar performance em buscas/filtros
const debounce = (func, delay = 300) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Export utilities
window.Storage = Storage;
window.Validation = Validation;
window.DateUtils = DateUtils;
window.UI = UI;
window.debounce = debounce;
